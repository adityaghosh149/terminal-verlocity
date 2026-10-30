import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { GameRun } from "@/models/GameRun";
import { inMemoryStore } from "@/lib/db/inMemoryStore";
import { round2 } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const boardType = searchParams.get("type") || "all-time"; // "all-time" | "daily"
    const mode = searchParams.get("mode") || "all";
    const difficulty = searchParams.get("difficulty") || "all";
    const usernameParam = searchParams.get("username")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    const db = await connectToDatabase();

    // Calculate Today's Daily Directive Parameters
    const now = new Date();
    const todayDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const todaySeed = `challenge_${todayDate}`;
    const nextResetUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
    );
    const msUntilReset = Math.max(0, nextResetUtc.getTime() - now.getTime());

    let rawRuns: any[] = [];
    let totalCount = 0;

    if (boardType === "daily") {
      // 1. Scoped specifically to TODAY'S Synchronized Challenge Seed
      if (db) {
        const filter: Record<string, any> = {
          status: "validated",
          seed: todaySeed,
        };
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
        const filtered = inMemoryStore.getRuns({
          seed: todaySeed,
          difficulty,
        });
        totalCount = filtered.length;
        rawRuns = filtered.slice(skip, skip + limit);
      }
    } else {
      // 2. All-Time Arcade Hall of Fame (Classic & Endless)
      if (db) {
        const filter: Record<string, any> = { status: "validated" };
        if (mode !== "all") {
          filter.mode = mode;
        } else {
          // By default, keep all-time focused on arcade modes (classic & endless)
          filter.mode = { $in: ["classic", "endless"] };
        }
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
        const filtered = inMemoryStore.getRuns({
          mode: mode === "all" ? undefined : mode,
          excludeMode: mode === "all" ? "daily" : undefined,
          difficulty,
        });
        totalCount = filtered.length;
        rawRuns = filtered.slice(skip, skip + limit);
      }
    }

    // Determine current operative standing
    let myRank: number | null = null;
    let myBestScore: number | null = null;

    if (usernameParam) {
      if (boardType === "daily") {
        if (db) {
          const userRegex = new RegExp(`^${usernameParam.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i");
          const filter: Record<string, any> = {
            status: "validated",
            seed: todaySeed,
            username: userRegex,
          };
          if (difficulty !== "all") filter.difficulty = difficulty;
          const bestRun = await GameRun.findOne(filter).sort({ finalScore: -1 });
          if (bestRun) {
            myBestScore = bestRun.finalScore;
            const higherFilter: Record<string, any> = {
              status: "validated",
              seed: todaySeed,
              finalScore: { $gt: bestRun.finalScore },
            };
            if (difficulty !== "all") higherFilter.difficulty = difficulty;
            const higher = await GameRun.countDocuments(higherFilter);
            myRank = higher + 1;
          }
        } else {
          const userRuns = inMemoryStore.getRuns({
            seed: todaySeed,
            difficulty,
            username: usernameParam,
          });
          if (userRuns.length > 0) {
            myBestScore = userRuns[0].finalScore;
            const allToday = inMemoryStore.getRuns({ seed: todaySeed, difficulty });
            const higher = allToday.filter((r) => r.finalScore > myBestScore!).length;
            myRank = higher + 1;
          }
        }
      } else {
        if (db) {
          const userRegex = new RegExp(`^${usernameParam.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i");
          const filter: Record<string, any> = {
            status: "validated",
            username: userRegex,
            mode: mode !== "all" ? mode : { $in: ["classic", "endless"] },
          };
          if (difficulty !== "all") filter.difficulty = difficulty;
          const bestRun = await GameRun.findOne(filter).sort({ finalScore: -1 });
          if (bestRun) {
            myBestScore = bestRun.finalScore;
            const higherFilter: Record<string, any> = {
              status: "validated",
              mode: mode !== "all" ? mode : { $in: ["classic", "endless"] },
              finalScore: { $gt: bestRun.finalScore },
            };
            if (difficulty !== "all") higherFilter.difficulty = difficulty;
            const higher = await GameRun.countDocuments(higherFilter);
            myRank = higher + 1;
          }
        } else {
          const userRuns = inMemoryStore.getRuns({
            mode: mode === "all" ? undefined : mode,
            excludeMode: mode === "all" ? "daily" : undefined,
            difficulty,
            username: usernameParam,
          });
          if (userRuns.length > 0) {
            myBestScore = userRuns[0].finalScore;
            const allRuns = inMemoryStore.getRuns({
              mode: mode === "all" ? undefined : mode,
              excludeMode: mode === "all" ? "daily" : undefined,
              difficulty,
            });
            const higher = allRuns.filter((r) => r.finalScore > myBestScore!).length;
            myRank = higher + 1;
          }
        }
      }
    }

    const leaderboard = rawRuns.map((run: any, idx: number) => {
      const runUser = run.username || "PLAYER";
      return {
        rank: skip + idx + 1,
        runId: run.runId,
        userId: run.runId,
        username: runUser,
        displayName: runUser,
        level: Math.floor(Math.sqrt((run.finalScore || 0) / 40)) + 1,
        score: round2(run.finalScore),
        mode: run.mode,
        difficulty: run.difficulty,
        wpm: round2(run.wpm),
        accuracy: round2(run.accuracy),
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
      myBestScore: myBestScore !== null ? round2(myBestScore) : null,
      boardType,
      dailyDate: todayDate,
      dailySeed: todaySeed,
      msUntilReset,
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Failed to retrieve leaderboard." }, { status: 500 });
  }
}
