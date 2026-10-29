import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { GameRun } from "@/models/GameRun";
import { inMemoryStore, StoredRun } from "@/lib/db/inMemoryStore";
import { ProbabilityEngine } from "@/lib/probability/engine";
import { PacketEvent } from "@/types";

const SubmitRunSchema = z.object({
  runToken: z.string(),
  finalScore: z.number(),
  wpm: z.number(),
  accuracy: z.number(),
  maxCombo: z.number(),
  events: z.array(z.any()),
  endTime: z.number(),
  username: z.string().max(20).optional(),
});

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "fallback_run_signing_secret_min_32_chars";
const getRunSecret = () => new TextEncoder().encode(JWT_SECRET + "_game_run");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SubmitRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission payload." }, { status: 400 });
    }

    const { runToken, finalScore, wpm, accuracy, maxCombo, events, endTime, username } = parsed.data;

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
    const operativeName = (
      username ||
      (tokenPayload.username as string) ||
      "OPERATIVE"
    ).trim().toUpperCase().slice(0, 15);

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

    // Calculate aggregated probability metrics
    const metrics = ProbabilityEngine.aggregateRunMetrics(events as PacketEvent[]);

    const runRecord: StoredRun = {
      runId,
      username: operativeName,
      mode,
      difficulty,
      seed,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      durationSeconds,
      finalScore,
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy),
      packetsCaptured: metrics.totalIntercepted,
      cleanCount: metrics.cleanCount,
      corruptedCount: metrics.corruptedCount,
      missedCount: metrics.missedCount,
      ignoredCount: metrics.ignoredCount,
      totalExpectedValue: metrics.totalExpectedValue,
      totalRealizedScore: metrics.totalRealizedScore,
      maxCombo,
      status,
      validationReason,
      createdAt: new Date(),
    };

    // 4. Save Game Run in MongoDB (or fallback in-memory store)
    if (db) {
      await GameRun.create({
        ...runRecord,
        events: events.slice(0, 150),
      });
    } else {
      inMemoryStore.addRun(runRecord);
    }

    return NextResponse.json({
      success: true,
      validated: status === "validated",
      runId,
      username: operativeName,
      status,
      validationReason,
      finalScore,
      totalExpectedValue: metrics.totalExpectedValue,
      totalRealizedScore: metrics.totalRealizedScore,
      rationalDecisionIndex: metrics.rationalDecisionIndex,
      luckIndex: metrics.luckIndex,
    });
  } catch (err) {
    console.error("Game submission error:", err);
    return NextResponse.json({ error: "Failed to process score submission." }, { status: 500 });
  }
}
