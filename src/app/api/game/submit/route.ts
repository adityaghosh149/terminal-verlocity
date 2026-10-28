import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { GameRun } from "@/models/GameRun";
import { User } from "@/models/User";
import { Achievement, ACHIEVEMENT_DEFINITIONS } from "@/models/Achievement";
import { getSessionUser } from "@/lib/auth/sessionHelper";
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
});

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "fallback_run_signing_secret_min_32_chars";
const getRunSecret = () => new TextEncoder().encode(JWT_SECRET + "_game_run");

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const body = await req.json();
    const parsed = SubmitRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission payload." }, { status: 400 });
    }

    const { runToken, finalScore, wpm, accuracy, maxCombo, events, endTime } = parsed.data;

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

    await connectToDatabase();

    // 2. Check Idempotency: Prevent replay attacks
    const existing = await GameRun.findOne({ runId });
    if (existing) {
      return NextResponse.json(
        { error: "This game run has already been recorded and validated." },
        { status: 409 }
      );
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

    // 4. Save Game Run in MongoDB
    const gameRun = await GameRun.create({
      runId,
      userId: sessionUser?.userId || null,
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
      events: events.slice(0, 150), // Store up to 150 packet events
    });

    // 5. Update authenticated user progression & achievements
    const newlyUnlocked: string[] = [];
    if (sessionUser?.userId && status === "validated") {
      const user = await User.findById(sessionUser.userId);
      if (user) {
        user.gamesPlayed += 1;
        user.lifetimeScore += Math.max(0, finalScore);
        if (finalScore > user.bestScore) user.bestScore = finalScore;
        if (wpm > user.bestWpm) user.bestWpm = Math.round(wpm);

        user.packetsClean += metrics.cleanCount;
        user.packetsCorrupted += metrics.corruptedCount;
        user.packetsMissed += metrics.missedCount;

        // Cumulative rolling average accuracy
        user.avgAccuracy = Math.round(
          (user.avgAccuracy * (user.gamesPlayed - 1) + accuracy) / user.gamesPlayed
        );

        // Calculate XP & Level
        const earnedXp = Math.max(10, Math.floor(finalScore / 10) + metrics.totalIntercepted * 5);
        user.xp += earnedXp;
        // Level formula: Level = floor(sqrt(XP / 50)) + 1
        user.level = Math.floor(Math.sqrt(user.xp / 50)) + 1;

        await user.save();

        // Check Achievements
        const candidateAchievements = [];
        candidateAchievements.push("FIRST_RUN");

        if (metrics.cleanCount >= 5 && metrics.corruptedCount === 0) {
          candidateAchievements.push("CLEAN_STREAK_5");
        }
        if (accuracy >= 95 && metrics.totalIntercepted >= 5) {
          candidateAchievements.push("HIGH_ACCURACY");
        }
        if (finalScore >= 1000) {
          candidateAchievements.push("SCORE_1000");
        }
        if (difficulty === "hard" && durationSeconds >= 45) {
          candidateAchievements.push("HARD_SURVIVOR");
        }
        if (metrics.rationalDecisionIndex === 100 && metrics.totalIntercepted >= 5) {
          candidateAchievements.push("DATA_SCIENTIST");
        }
        if (wpm >= 80) {
          candidateAchievements.push("SPEED_DEMON");
        }

        for (const achId of candidateAchievements) {
          const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === achId);
          if (def) {
            try {
              const res = await Achievement.findOneAndUpdate(
                { userId: user._id, achievementId: achId },
                {
                  $setOnInsert: {
                    userId: user._id,
                    achievementId: achId,
                    title: def.title,
                    description: def.description,
                    icon: def.icon,
                  },
                },
                { upsert: true, new: false }
              );
              // If not found before, it's newly unlocked!
              if (!res) {
                newlyUnlocked.push(def.title);
              }
            } catch {
              // Ignore duplicate key collision
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      validated: status === "validated",
      runId,
      status,
      validationReason,
      finalScore,
      totalExpectedValue: metrics.totalExpectedValue,
      totalRealizedScore: metrics.totalRealizedScore,
      rationalDecisionIndex: metrics.rationalDecisionIndex,
      luckIndex: metrics.luckIndex,
      newAchievements: newlyUnlocked,
    });
  } catch (err) {
    console.error("Game submission error:", err);
    return NextResponse.json({ error: "Failed to process score submission." }, { status: 500 });
  }
}
