import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { GameRun } from "@/models/GameRun";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get("username");

    if (!rawUsername || !rawUsername.trim()) {
      return NextResponse.json({
        user: {
          username: "OPERATIVE",
          displayName: "Operative",
          level: 1,
          lifetimeScore: 0,
          bestScore: 0,
          gamesPlayed: 0,
          packetsClean: 0,
          packetsCorrupted: 0,
          packetsMissed: 0,
          bestWpm: 0,
          avgAccuracy: 100,
        },
        recentRuns: [],
      });
    }

    const username = rawUsername.trim().toUpperCase().slice(0, 15);
    await connectToDatabase();

    const runs = await GameRun.find({ username, status: "validated" })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (runs.length === 0) {
      return NextResponse.json({
        user: {
          username,
          displayName: username,
          level: 1,
          lifetimeScore: 0,
          bestScore: 0,
          gamesPlayed: 0,
          packetsClean: 0,
          packetsCorrupted: 0,
          packetsMissed: 0,
          bestWpm: 0,
          avgAccuracy: 100,
        },
        recentRuns: [],
      });
    }

    const gamesPlayed = runs.length;
    const lifetimeScore = runs.reduce((sum, r) => sum + Math.max(0, r.finalScore), 0);
    const bestScore = Math.max(...runs.map((r) => r.finalScore), 0);
    const bestWpm = Math.max(...runs.map((r) => r.wpm), 0);
    const packetsClean = runs.reduce((sum, r) => sum + (r.cleanCount || 0), 0);
    const packetsCorrupted = runs.reduce((sum, r) => sum + (r.corruptedCount || 0), 0);
    const packetsMissed = runs.reduce((sum, r) => sum + (r.missedCount || 0), 0);
    const avgAccuracy = Math.round(
      runs.reduce((sum, r) => sum + (r.accuracy || 100), 0) / gamesPlayed
    );
    const level = Math.floor(Math.sqrt(lifetimeScore / 60)) + 1;

    return NextResponse.json({
      user: {
        username,
        displayName: username,
        level,
        lifetimeScore,
        bestScore,
        gamesPlayed,
        packetsClean,
        packetsCorrupted,
        packetsMissed,
        bestWpm,
        avgAccuracy,
      },
      recentRuns: runs.slice(0, 10).map((r) => ({
        runId: r.runId,
        mode: r.mode,
        difficulty: r.difficulty,
        score: r.finalScore,
        wpm: r.wpm,
        accuracy: r.accuracy,
        cleanCount: r.cleanCount,
        corruptedCount: r.corruptedCount,
        durationSeconds: r.durationSeconds,
        date: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("Player stats error:", err);
    return NextResponse.json({ error: "Failed to retrieve player statistics." }, { status: 500 });
  }
}
