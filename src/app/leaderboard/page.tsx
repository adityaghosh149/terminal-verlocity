"use client";

import React, { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";

import { LeaderboardFilters } from "@/components/leaderboard/LeaderboardFilters";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { LeaderboardPagination } from "@/components/leaderboard/LeaderboardPagination";

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myBestScore, setMyBestScore] = useState<number | null>(null);

  // Filters
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mode: modeFilter,
        difficulty: difficultyFilter,
        page: page.toString(),
        limit: "15",
      });
      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.leaderboard);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
        setMyRank(data.myRank);
        setMyBestScore(data.myBestScore);
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [modeFilter, difficultyFilter, page]);

  return (
    <div className="container max-w-6xl px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono text-primary mb-2">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            COMPETITIVE TELEMETRY
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tight text-foreground">
            GLOBAL LEADERBOARDS
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time verified standings across all operative data stream interceptions
          </p>
        </div>

        {/* User Standing Card */}
        {user && myRank && (
          <div className="p-3.5 rounded-xl bg-card border border-primary/40 flex items-center gap-4 glow-primary font-mono">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/30 font-black text-lg">
              #{myRank}
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">YOUR STANDING</div>
              <div className="text-sm font-bold text-foreground">{user.displayName}</div>
              <div className="text-xs text-primary">
                Best Score: {myBestScore?.toLocaleString()} PTS
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Controls Bar */}
      <LeaderboardFilters
        modeFilter={modeFilter}
        setModeFilter={setModeFilter}
        difficultyFilter={difficultyFilter}
        setDifficultyFilter={setDifficultyFilter}
        setPage={setPage}
      />

      {/* Leaderboard Table Container */}
      <div className="rounded-xl border border-border/80 bg-card/70 backdrop-blur-md overflow-hidden shadow-2xl">
        <LeaderboardTable entries={entries} loading={loading} />
        <LeaderboardPagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          setPage={setPage}
        />
      </div>
    </div>
  );
}
