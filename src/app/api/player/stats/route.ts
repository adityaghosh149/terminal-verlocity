import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { GameRun } from "@/models/GameRun";
import { inMemoryStore } from "@/lib/db/inMemoryStore";
import { round2 } from "@/lib/utils";
import {
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

async function getAuthenticatedUsername(req: NextRequest): Promise<string | null> {
  const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload?.username) return payload.username;
  }
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (refreshToken) {
    const refreshPayload = await verifyRefreshToken(refreshToken);
    if (refreshPayload?.username) return refreshPayload.username;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryUsername = searchParams.get("username")?.trim();
    const authUsername = await getAuthenticatedUsername(req);

    const targetUsername = queryUsername || authUsername;

    if (!targetUsername) {
      return NextResponse.json({
        user: null,
        metrics: null,
        improvementHistory: [],
        runs: [],
      });
    }

    const db = await connectToDatabase();
    let rawRuns: any[] = [];

    if (db) {
      const userRegex = new RegExp(`^${targetUsername.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i");
      rawRuns = await GameRun.find({ username: userRegex, status: "validated" })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
    } else {
      rawRuns = inMemoryStore.getRuns({ username: targetUsername }).slice(0, 100);
    }

    if (rawRuns.length === 0) {
      return NextResponse.json({
        user: {
          username: targetUsername,
          displayName: targetUsername,
          level: 1,
        },
        metrics: {
          lifetimeScore: 0,
          bestScore: 0,
          avgScore: 0,
          bestWpm: 0,
          avgWpm: 0,
          minWpm: 0,
          bestAccuracy: 0,
          avgAccuracy: 100,
          gamesPlayed: 0,
          totalClean: 0,
          totalCorrupted: 0,
          totalMissed: 0,
        },
        improvementHistory: [],
        runs: [],
      });
    }

    const totalGames = rawRuns.length;
    const scores = rawRuns.map((r) => r.finalScore || 0);
    const wpms = rawRuns.map((r) => r.wpm || 0);
    const accuracies = rawRuns.map((r) => r.accuracy || 100);

    const lifetimeScore = round2(scores.reduce((sum, s) => sum + Math.max(0, s), 0));
    const bestScore = round2(Math.max(...scores, 0));
    const avgScore = round2(lifetimeScore / totalGames);

    const bestWpm = round2(Math.max(...wpms, 0));
    const avgWpm = round2(wpms.reduce((a, b) => a + b, 0) / totalGames);
    const minWpm = round2(Math.min(...wpms));

    const bestAccuracy = round2(Math.max(...accuracies, 0));
    const avgAccuracy = round2(accuracies.reduce((a, b) => a + b, 0) / totalGames);

    const totalClean = rawRuns.reduce((sum, r) => sum + (r.cleanCount || 0), 0);
    const totalCorrupted = rawRuns.reduce((sum, r) => sum + (r.corruptedCount || 0), 0);
    const totalMissed = rawRuns.reduce((sum, r) => sum + (r.missedCount || 0), 0);
    const level = Math.floor(Math.sqrt(lifetimeScore / 60)) + 1;

    // Detailed Game-by-Game Breakdown
    const detailedRuns = rawRuns.map((run, idx) => {
      const events = (run.events || []) as any[];
      const finalScore = round2(run.finalScore || 0);

      let actualTypingScore = run.actualTypingScore;
      let multiplierScore = run.multiplierScore;
      let bonusScore = run.speedBonusScore;
      let expectedScore = run.expectedScore ?? round2(run.totalExpectedValue || 0);

      // If not directly stored on document, calculate exact decomposition from events
      if (actualTypingScore === undefined || multiplierScore === undefined || bonusScore === undefined) {
        let pure = 0;
        let mult = 0;
        let spd = 0;
        let exp = 0;

        for (const e of events) {
          if (e.action === "intercepted") {
            exp += (e.expectedValue || 0);
            pure += e.pureTypingPoints !== undefined
              ? e.pureTypingPoints
              : (e.outcome === "clean" ? (e.reward || 0) : -(e.corruptionPenalty || 0));
            mult += (e.multiplierPoints || 0);
            spd += (e.speedBonusPoints || 0);
          } else if (e.action === "missed") {
            pure += (e.pointsDelta || 0);
          }
        }

        actualTypingScore = round2(pure);
        multiplierScore = round2(mult);
        bonusScore = round2(spd);
        expectedScore = round2(exp);

        const diff = round2(finalScore - (actualTypingScore + multiplierScore + bonusScore));
        actualTypingScore = round2(actualTypingScore + diff);
      } else {
        actualTypingScore = round2(actualTypingScore);
        multiplierScore = round2(multiplierScore);
        bonusScore = round2(bonusScore);
        expectedScore = round2(expectedScore);
      }

      // Luck score calculation: strictly using expected EV and pure typing score, NOT total score
      const luckScore = round2(run.luckScore ?? (actualTypingScore - expectedScore));
      const luckRatio = expectedScore > 0 ? round2((actualTypingScore / expectedScore) * 100) : 100;

      return {
        id: run.runId || `run_${idx}`,
        gameIndex: totalGames - idx,
        mode: run.mode,
        difficulty: run.difficulty,
        finalScore,
        expectedScore,
        multiplierScore,
        bonusScore,
        actualTypingScore,
        baseScore: actualTypingScore,
        luckScore,
        luckRatio,
        wpm: round2(run.wpm),
        accuracy: round2(run.accuracy),
        cleanCount: run.cleanCount || 0,
        corruptedCount: run.corruptedCount || 0,
        missedCount: run.missedCount || 0,
        maxCombo: run.maxCombo || 0,
        durationSeconds: round2(run.durationSeconds),
        date: run.createdAt,
      };
    });

    // Chronological improvement timeline (oldest to newest)
    const improvementHistory = [...detailedRuns].reverse().map((r, i) => ({
      game: i + 1,
      runId: r.id,
      mode: r.mode,
      difficulty: r.difficulty,
      score: r.finalScore,
      expected: r.expectedScore,
      wpm: r.wpm,
      accuracy: r.accuracy,
      luckScore: r.luckScore,
      date: new Date(r.date).toLocaleDateString(),
    }));

    return NextResponse.json({
      user: {
        username: targetUsername,
        displayName: targetUsername,
        level,
      },
      metrics: {
        lifetimeScore,
        bestScore,
        avgScore,
        bestWpm,
        avgWpm,
        minWpm,
        bestAccuracy,
        avgAccuracy,
        gamesPlayed: totalGames,
        totalClean,
        totalCorrupted,
        totalMissed,
      },
      improvementHistory,
      runs: detailedRuns,
    });
  } catch (err) {
    console.error("Player stats error:", err);
    return NextResponse.json({ error: "Failed to retrieve user statistics." }, { status: 500 });
  }
}
