import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { GameRun } from "@/models/GameRun";
import { getSessionUser } from "@/lib/auth/sessionHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(sessionUser.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch recent 10 game runs
    const recentRuns = await GameRun.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        isVerified: user.isVerified,
        level: user.level,
        xp: user.xp,
        lifetimeScore: user.lifetimeScore,
        bestScore: user.bestScore,
        gamesPlayed: user.gamesPlayed,
        packetsClean: user.packetsClean,
        packetsCorrupted: user.packetsCorrupted,
        packetsMissed: user.packetsMissed,
        bestWpm: user.bestWpm,
        avgAccuracy: user.avgAccuracy,
        createdAt: user.createdAt,
      },
      recentRuns: recentRuns.map((r) => ({
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
