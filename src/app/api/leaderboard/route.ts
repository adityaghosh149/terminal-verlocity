import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { GameRun } from "@/models/GameRun";
import { inMemoryStore } from "@/lib/db/inMemoryStore";

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

    const db = await connectToDatabase();

    let rawRuns: any[] = [];
    let totalCount = 0;

    if (db) {
      const filter: Record<string, any> = { status: "validated" };
      if (mode !== "all") filter.mode = mode;
      if (difficulty !== "all") filter.difficulty = difficulty;

      const [runs, count] = await Promise.all([
        GameRun.find(filter)
          .sort({ finalScore: -1, accuracy: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        GameRun.countDocuments(filter),
      ]);
      rawRuns = runs;
      totalCount = count;
    } else {
      const filtered = inMemoryStore.getRuns({ mode, difficulty });
      totalCount = filtered.length;
      rawRuns = filtered.slice(skip, skip + limit);
    }

    let myRank: number | null = null;
    let myBestScore: number | null = null;

    if (usernameParam) {
      if (db) {
        const filter: Record<string, any> = { status: "validated", username: usernameParam };
        if (mode !== "all") filter.mode = mode;
        if (difficulty !== "all") filter.difficulty = difficulty;

        const bestUserRun = await GameRun.findOne(filter).sort({ finalScore: -1 });
        if (bestUserRun) {
          myBestScore = bestUserRun.finalScore;
          const globalFilter: Record<string, any> = { status: "validated", finalScore: { $gt: bestUserRun.finalScore } };
          if (mode !== "all") globalFilter.mode = mode;
          if (difficulty !== "all") globalFilter.difficulty = difficulty;
          const higherCount = await GameRun.countDocuments(globalFilter);
          myRank = higherCount + 1;
        }
      } else {
        const userRuns = inMemoryStore.getRuns({ mode, difficulty, username: usernameParam });
        if (userRuns.length > 0) {
          myBestScore = userRuns[0].finalScore;
          const allRuns = inMemoryStore.getRuns({ mode, difficulty });
          const higherCount = allRuns.filter((r) => r.finalScore > myBestScore!).length;
          myRank = higherCount + 1;
        }
      }
    }

    const leaderboard = rawRuns.map((run: any, idx: number) => {
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
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      myRank,
      myBestScore,
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Failed to retrieve leaderboard." }, { status: 500 });
  }
}
