"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, User, Zap, Clock, Calendar, ArrowRight, Shield } from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { useSessionStore } from "@/store/useSessionStore";

import { LeaderboardFilters } from "@/components/leaderboard/LeaderboardFilters";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { LeaderboardPagination } from "@/components/leaderboard/LeaderboardPagination";
import { PlayerProfileModal } from "@/components/leaderboard/PlayerProfileModal";

export default function LeaderboardPage() {
  const { user, openAuthModal } = useAuthStore();
  const { username } = useSessionStore();
  const effectiveUsername = user?.username || username;
  const [boardType, setBoardType] = useState<"all-time" | "daily">("all-time");

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myBestScore, setMyBestScore] = useState<number | null>(null);

  // Daily metadata
  const [dailySeed, setDailySeed] = useState<string>("");
  const [dailyDate, setDailyDate] = useState<string>("");
  const [msUntilReset, setMsUntilReset] = useState<number>(0);

  // Filters
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  // Fetch Leaderboard from API
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: boardType,
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
        setEntries(data.leaderboard || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
        setMyRank(data.myRank);
        setMyBestScore(data.myBestScore);
        setDailySeed(data.dailySeed || "");
        setDailyDate(data.dailyDate || "");
        setMsUntilReset(data.msUntilReset || 0);
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [boardType, modeFilter, difficultyFilter, page, username]);

  // Live Countdown Timer for Daily Reset
  useEffect(() => {
    if (msUntilReset <= 0) return;
    const interval = setInterval(() => {
      setMsUntilReset((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [msUntilReset]);

  const formatCountdown = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${hours.toString().padStart(2, "0")}h ${minutes
      .toString()
      .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  };

  return (
    <div className="container max-w-6xl px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono text-primary mb-2">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            COMPETITIVE TELEMETRY
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tight text-foreground">
            {boardType === "daily" ? "DAILY DIRECTIVE STANDINGS" : "GLOBAL ARCADE LEADERBOARD"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {boardType === "daily"
              ? "Synchronized daily challenge: All users face the identical seed today"
              : "All-time verified records across Classic and Survival arcade modes"}
          </p>
        </div>

        {/* User Standing Card */}
        {effectiveUsername ? (
          myRank ? (
            <div className="p-3.5 rounded-xl bg-card border border-primary/40 flex items-center gap-4 glow-primary font-mono">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/30 font-black text-lg">
                #{myRank}
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">
                  {boardType === "daily" ? "TODAY'S RANK" : "ALL-TIME RANK"}
                </div>
                <div className="text-sm font-bold text-foreground">@{effectiveUsername}</div>
                <div className="text-xs text-primary">
                  Best Score: {myBestScore?.toLocaleString()} PTS
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-card border border-border flex items-center gap-3 font-mono text-xs">
              <span className="text-muted-foreground">USER:</span>
              <span className="font-bold text-primary">@{effectiveUsername}</span>
              <span className="text-muted-foreground text-[10px]">(No runs yet)</span>
            </div>
          )
        ) : (
          <button
            onClick={() => openAuthModal("login")}
            className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-mono font-bold px-4 py-2.5 rounded-lg text-xs border border-border transition-all"
          >
            <User className="h-4 w-4 text-primary" />
            LOG IN TO RANK
          </button>
        )}
      </div>

      {/* Top Board Type Switcher Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-border/80 pb-3 font-mono text-xs">
        <button
          onClick={() => {
            setBoardType("all-time");
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
            boardType === "all-time"
              ? "bg-primary text-primary-foreground shadow-md glow-primary"
              : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <Trophy className="h-4 w-4" />
          ALL-TIME HALL OF FAME
        </button>

        <button
          onClick={() => {
            setBoardType("daily");
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
            boardType === "daily"
              ? "bg-primary text-primary-foreground shadow-md glow-primary"
              : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <Zap className="h-4 w-4 text-amber-400" />
          TODAY'S DAILY CHALLENGE
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
            SYNCHRONIZED
          </span>
        </button>
      </div>

      {/* Daily Directive Metadata Banner (Shown only on Daily Tab) */}
      {boardType === "daily" && (
        <div className="mb-6 p-5 rounded-xl border border-primary/40 bg-card/90 backdrop-blur-md shadow-xl font-mono text-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold tracking-wider">
                <Calendar className="h-4 w-4" />
                DAILY DIRECTIVE // {dailyDate || "TODAY"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                SEED IDENTIFIER: <span className="text-foreground font-bold">{dailySeed}</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-sans mt-1">
                Every operative intercepts the exact same words and corruption rates. Pure typing speed & decision skill dictate rank.
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/80 border border-border text-foreground">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-[10px] text-muted-foreground uppercase">RESET IN:</span>
                <span className="font-bold text-amber-400">{formatCountdown(msUntilReset)}</span>
              </div>

              <Link
                href="/game"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-display font-bold text-xs hover:opacity-90 transition-opacity glow-primary"
              >
                PLAY TODAY'S SEED
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls Bar */}
      <LeaderboardFilters
        boardType={boardType}
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
          currentUsername={effectiveUsername || undefined}
          onSelectPlayer={setSelectedPlayer}
        />
        <LeaderboardPagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          setPage={setPage}
        />
      </div>

      {/* Interactive Player Profile Telemetry Modal */}
      {selectedPlayer && (
        <PlayerProfileModal
          username={selectedPlayer}
          isSelf={selectedPlayer.toLowerCase() === effectiveUsername?.toLowerCase()}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
