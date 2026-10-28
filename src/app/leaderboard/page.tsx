"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  Medal,
  Flame,
  Shield,
  Zap,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Loader2,
} from "lucide-react";
import { LeaderboardEntry, GameMode, Difficulty } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";

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
          <div className="p-3.5 rounded-xl bg-card border border-primary/40 flex items-center gap-4 glow-primary">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/30 font-mono font-black text-lg">
              #{myRank}
            </div>
            <div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase">
                YOUR STANDING
              </div>
              <div className="text-sm font-bold text-foreground">{user.displayName}</div>
              <div className="text-xs font-mono text-primary">
                Best Score: {myBestScore?.toLocaleString()} PTS
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="mb-6 p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        {/* Game Mode Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-primary" />
            MODE:
          </span>
          <div className="flex rounded-lg bg-secondary/80 p-0.5 border border-border">
            {[
              { id: "all", label: "ALL MODES" },
              { id: "classic", label: "CLASSIC" },
              { id: "endless", label: "ENDLESS" },
              { id: "daily", label: "DAILY CHALLENGE" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setModeFilter(m.id);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                  modeFilter === m.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-amber-400" />
            DIFFICULTY:
          </span>
          <select
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-secondary/80 border border-border text-foreground rounded-md px-3 py-1.5 cursor-pointer font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-border/80 bg-card/70 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-border/60 bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="py-3.5 px-4 w-16">RANK</th>
                <th className="py-3.5 px-4">OPERATIVE</th>
                <th className="py-3.5 px-4">SCORE</th>
                <th className="py-3.5 px-4">MODE</th>
                <th className="py-3.5 px-4">DIFFICULTY</th>
                <th className="py-3.5 px-4">SPEED</th>
                <th className="py-3.5 px-4">ACCURACY</th>
                <th className="py-3.5 px-4">PACKETS</th>
                <th className="py-3.5 px-4">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Synchronizing telemetry records...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    No validated run records matching current filter criteria.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isTop3 = entry.rank <= 3;
                  const medalColor =
                    entry.rank === 1
                      ? "text-amber-400"
                      : entry.rank === 2
                      ? "text-slate-300"
                      : "text-amber-600";

                  return (
                    <tr
                      key={entry.rank}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold flex items-center gap-1.5">
                        {isTop3 ? (
                          <Medal className={`h-4 w-4 ${medalColor}`} />
                        ) : (
                          <span className="text-muted-foreground">{entry.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] text-primary">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-foreground">
                              {entry.displayName}
                            </span>
                            <span className="text-[10px] text-muted-foreground block -mt-0.5">
                              @{entry.username}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-black text-primary text-sm glow-text">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[11px] font-semibold text-muted-foreground">
                        {entry.mode}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            entry.difficulty === "easy"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : entry.difficulty === "medium"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {entry.difficulty}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-foreground font-semibold">
                        {entry.wpm} WPM
                      </td>
                      <td className="py-3.5 px-4 text-foreground font-semibold">
                        {entry.accuracy}%
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <span className="text-emerald-400">{entry.cleanPackets}</span> /{" "}
                        <span className="text-rose-400">{entry.corruptedPackets || 0}</span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border/60 bg-secondary/20 flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground">
              Showing page {page} of {totalPages} ({totalCount} verified records)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded bg-secondary border border-border hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded bg-secondary border border-border hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
