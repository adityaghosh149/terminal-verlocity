"use client";

import React, { useEffect, useState } from "react";
import { Trophy, User } from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { useSessionStore } from "@/store/useSessionStore";

import { LeaderboardFilters } from "@/components/leaderboard/LeaderboardFilters";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { LeaderboardPagination } from "@/components/leaderboard/LeaderboardPagination";

export default function LeaderboardPage() {
  const { username, openCallsignModal } = useSessionStore();
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
      if (username) {
        params.append("username", username);
      }
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
  }, [modeFilter, difficultyFilter, page, username]);

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
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Real-time verified standings across all operative data stream interceptions
          </p>
        </div>

        {/* User Standing Card */}
        {username ? (
          myRank ? (
            <div className="p-3.5 rounded-xl bg-card border border-primary/40 flex items-center gap-4 glow-primary font-mono">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/30 font-black text-lg">
                #{myRank}
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">SESSION STANDING</div>
                <div className="text-sm font-bold text-foreground">@{username}</div>
                <div className="text-xs text-primary">
                  Best Score: {myBestScore?.toLocaleString()} PTS
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-card border border-border flex items-center gap-3 font-mono text-xs">
              <span className="text-muted-foreground">ACTIVE CALLSIGN:</span>
              <span className="font-bold text-primary">@{username}</span>
              <span className="text-muted-foreground text-[10px]">(No runs recorded yet)</span>
            </div>
          )
        ) : (
          <button
            onClick={openCallsignModal}
            className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-mono font-bold px-4 py-2.5 rounded-lg text-xs border border-border transition-all"
          >
            <User className="h-4 w-4 text-primary" />
            ENTER CALLSIGN
          </button>
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
        <LeaderboardTable
          entries={entries}
          loading={loading}
          currentUsername={username || undefined}
        />
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
