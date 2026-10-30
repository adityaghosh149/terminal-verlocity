import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { GameRun } from "@/models/GameRun";
import { inMemoryStore, StoredRun } from "@/lib/db/inMemoryStore";
import { ProbabilityEngine } from "@/lib/probability/engine";
import { PacketEvent } from "@/types";
import { round2 } from "@/lib/utils";
import {
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth/jwt";

const SubmitRunSchema = z.object({
  runToken: z.string(),
  finalScore: z.number(),
  actualTypingScore: z.number().optional(),
  multiplierScore: z.number().optional(),
  speedBonusScore: z.number().optional(),
  expectedScore: z.number().optional(),
  luckScore: z.number().optional(),
  wpm: z.number(),
  accuracy: z.number(),
  maxCombo: z.number(),
  events: z.array(z.any()),
  endTime: z.number(),
  username: z.string().max(25).optional(),
});

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "fallback_run_signing_secret_min_32_chars";
const getRunSecret = () => new TextEncoder().encode(JWT_SECRET + "_game_run");

async function getAuthenticatedUserId(req: NextRequest): Promise<string | undefined> {
  const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload?.userId) return payload.userId;
  }
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (refreshToken) {
    const refreshPayload = await verifyRefreshToken(refreshToken);
    if (refreshPayload?.userId) return refreshPayload.userId;
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SubmitRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission payload." }, { status: 400 });
    }

    const {
      runToken,
      finalScore,
      actualTypingScore: clientActualTyping,
      multiplierScore: clientMultiplier,
      speedBonusScore: clientSpeedBonus,
      expectedScore: clientExpected,
      wpm,
      accuracy,
      maxCombo,
      events,
      endTime,
      username,
    } = parsed.data;

    // 1. Verify tamper-evident run authorization token
    let tokenPayload;
    try {
      const { payload } = await jwtVerify(runToken, getRunSecret());
      tokenPayload = payload;
    } catch {
      return NextResponse.json(
        { error: "Invalid or forged game authorization token." },
        { status: 403 }
      );
    }

    const runId = tokenPayload.runId as string;
    const mode = tokenPayload.mode as "classic" | "endless" | "daily";
    const difficulty = tokenPayload.difficulty as "easy" | "medium" | "hard";
    const seed = tokenPayload.seed as string;
    const startTime = tokenPayload.startTime as number;

    // Preserve upper/lower username casing
    const playerName = (
      username ||
      (tokenPayload.username as string) ||
      "Player"
    ).trim().slice(0, 20);

    const userId = await getAuthenticatedUserId(req);
    const db = await connectToDatabase();

    // 2. Check Idempotency: Prevent replay attacks
    if (db) {
      const existing = await GameRun.findOne({ runId });
      if (existing) {
        return NextResponse.json(
          { error: "This game run has already been recorded and validated." },
          { status: 409 }
        );
      }
    } else {
      if (inMemoryStore.findRun(runId)) {
        return NextResponse.json(
          { error: "This game run has already been recorded and validated." },
          { status: 409 }
        );
      }
    }

    // 3. Score & Duration Tampering Detection
    const durationSeconds = Math.max(1, Math.round((endTime - startTime) / 1000));
    let status: "validated" | "rejected" = "validated";
    let validationReason = "Passed all automated telemetry and integrity bounds.";

    // Rule: Duration cannot be negative or absurdly long
    if (endTime < startTime || durationSeconds > 7200) {
      status = "rejected";
      validationReason = "Implausible run timeline or timestamp alteration.";
    }

    // Rule: Speed check (superhuman threshold)
    if (wpm > 240) {
      status = "rejected";
      validationReason = `Anomalous typing velocity: ${wpm} WPM exceeds plausible physical limits.`;
    }

    // Rule: Verify packet event tally
    const calculatedSum = events
      .filter((e: PacketEvent) => e.action === "intercepted")
      .reduce((sum: number, e: PacketEvent) => sum + (e.pointsDelta || 0), 0);

    if (Math.abs(calculatedSum - finalScore) > 100) {
      status = "rejected";
      validationReason = `Score discrepancy: Claimed score (${finalScore}) does not match packet telemetry sum (${calculatedSum}).`;
    }

    // 4. Calculate Exact Score Decomposition:
    // Pure score from typing (base clean rewards - base penalties)
    let calcPureTyping = 0;
    let calcMultiplier = 0;
    let calcSpeedBonus = 0;
    let calcExpected = 0;

    for (const e of (events as PacketEvent[])) {
      if (e.action === "intercepted") {
        calcExpected += (e.expectedValue || 0);
        const pure = e.pureTypingPoints !== undefined
          ? e.pureTypingPoints
          : (e.outcome === "clean" ? (e.reward || 0) : -(e.corruptionPenalty || 0));
        const mult = e.multiplierPoints !== undefined ? e.multiplierPoints : 0;
        const spd = e.speedBonusPoints !== undefined ? e.speedBonusPoints : 0;
        calcPureTyping += pure;
        calcMultiplier += mult;
        calcSpeedBonus += spd;
      } else if (e.action === "missed") {
        calcPureTyping += (e.pointsDelta || 0);
      }
    }

    calcPureTyping = round2(calcPureTyping);
    calcMultiplier = round2(calcMultiplier);
    calcSpeedBonus = round2(calcSpeedBonus);
    calcExpected = round2(calcExpected);

    let finalActualTyping = round2(clientActualTyping ?? calcPureTyping);
    let finalMultiplier = round2(clientMultiplier ?? calcMultiplier);
    let finalSpeedBonus = round2(clientSpeedBonus ?? calcSpeedBonus);
    let finalExpected = round2(clientExpected ?? calcExpected);
    const validFinalScore = round2(finalScore);

    // Strict Mathematical Invariant: actualTypingScore + multiplierScore + speedBonusScore === finalScore
    const totalComponents = round2(finalActualTyping + finalMultiplier + finalSpeedBonus);
    if (totalComponents !== validFinalScore) {
      finalActualTyping = round2(validFinalScore - (finalMultiplier + finalSpeedBonus));
    }

    // Strict Luck Score Rule:
    // "luck should be calculated using expected and pure score through typing not the total score"
    const finalLuckScore = round2(finalActualTyping - finalExpected);

    // Calculate aggregated probability metrics
    const metrics = ProbabilityEngine.aggregateRunMetrics(events as PacketEvent[]);

    const runRecord: StoredRun = {
      runId,
      username: playerName,
      mode,
      difficulty,
      seed,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      durationSeconds: round2(durationSeconds),
      finalScore: validFinalScore,
      actualTypingScore: finalActualTyping,
      multiplierScore: finalMultiplier,
      speedBonusScore: finalSpeedBonus,
      expectedScore: finalExpected,
      luckScore: finalLuckScore,
      wpm: round2(wpm),
      accuracy: round2(accuracy),
      packetsCaptured: metrics.totalIntercepted,
      cleanCount: metrics.cleanCount,
      corruptedCount: metrics.corruptedCount,
      missedCount: metrics.missedCount,
      ignoredCount: metrics.ignoredCount,
      totalExpectedValue: finalExpected,
      totalRealizedScore: metrics.totalRealizedScore,
      maxCombo,
      status,
      validationReason,
      createdAt: new Date(),
    };

    // 5. Save Complete Game Run in MongoDB (or fallback in-memory store)
    if (db) {
      await GameRun.create({
        ...runRecord,
        userId,
        events: events.slice(0, 200),
      });
    } else {
      inMemoryStore.addRun(runRecord);
    }

    return NextResponse.json({
      success: true,
      validated: status === "validated",
      runId,
      username: playerName,
      status,
      validationReason,
      finalScore: validFinalScore,
      actualTypingScore: finalActualTyping,
      multiplierScore: finalMultiplier,
      speedBonusScore: finalSpeedBonus,
      expectedScore: finalExpected,
      luckScore: finalLuckScore,
      totalExpectedValue: finalExpected,
      totalRealizedScore: metrics.totalRealizedScore,
      rationalDecisionIndex: metrics.rationalDecisionIndex,
      luckIndex: metrics.luckIndex,
    });
  } catch (err) {
    console.error("Game submission error:", err);
    return NextResponse.json({ error: "Failed to process score submission." }, { status: 500 });
  }
}
