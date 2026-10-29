import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { GameRun } from "@/models/GameRun";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "all";
    const difficulty = searchParams.get("difficulty") || "all";
    const usernameParam = searchParams.get("username")?.trim().toUpperCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const filter: Record<string, any> = {
      status: "validated",
    };

    if (mode !== "all") filter.mode = mode;
    if (difficulty !== "all") filter.difficulty = difficulty;

    const [runs, totalCount] = await Promise.all([
      GameRun.find(filter)
        .sort({ finalScore: -1, accuracy: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GameRun.countDocuments(filter),
    ]);

    let myRank: number | null = null;
    let myBestScore: number | null = null;

    if (usernameParam) {
      const bestUserRun = await GameRun.findOne({
        ...filter,
        username: usernameParam,
      }).sort({ finalScore: -1 });

      if (bestUserRun) {
        myBestScore = bestUserRun.finalScore;
        const higherCount = await GameRun.countDocuments({
          ...filter,
          finalScore: { $gt: bestUserRun.finalScore },
        });
        myRank = higherCount + 1;
      }
    }

    const leaderboard = runs.map((run: any, idx: number) => {
      const runUser = run.username || "OPERATIVE";
      return {
        rank: skip + idx + 1,
        runId: run.runId,
        userId: run.runId,
        username: runUser,
        displayName: runUser,
        level: Math.floor(Math.sqrt((run.finalScore || 0) / 40)) + 1,
        score: run.finalScore,
        mode: run.mode,
        difficulty: run.difficulty,
        wpm: run.wpm,
        accuracy: run.accuracy,
        cleanPackets: run.cleanCount,
        corruptedPackets: run.corruptedCount,
        date: run.createdAt,
      };
    });

    return NextResponse.json({
      leaderboard,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      myRank,
      myBestScore,
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Failed to retrieve leaderboard." }, { status: 500 });
  }
}
