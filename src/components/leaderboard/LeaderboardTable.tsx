"use client";

import React from "react";
import { Medal, User, Loader2 } from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { formatNumber } from "@/lib/utils";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  currentUsername?: string;
  onSelectPlayer?: (username: string) => void;
}

export function LeaderboardTable({
  entries,
  loading,
  currentUsername,
  onSelectPlayer,
}: LeaderboardTableProps) {
  const normCurrent = currentUsername?.trim().toLowerCase();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left font-mono text-xs">
        <thead className="border-b border-border/60 bg-secondary/40 text-muted-foreground">
          <tr>
            <th className="py-3.5 px-4 w-16">RANK</th>
            <th className="py-3.5 px-4">PLAYER</th>
            <th className="py-3.5 px-4">SCORE</th>
            <th className="py-3.5 px-4">MODE</th>
            <th className="py-3.5 px-4">DIFFICULTY</th>
            <th className="py-3.5 px-4">SPEED</th>
            <th className="py-3.5 px-4">ACCURACY</th>
            <th className="py-3.5 px-4">PACKETS</th>
            <th className="py-3.5 px-4">TIMESTAMP</th>
            <th className="py-3.5 px-4 text-right">PROFILE</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {loading ? (
            <tr>
              <td colSpan={10} className="py-12 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                Synchronizing telemetry records...
              </td>
            </tr>
          ) : entries.length === 0 ? (
            <tr>
              <td colSpan={10} className="py-12 text-center text-muted-foreground">
                No validated run records matching current filter criteria.
              </td>
            </tr>
          ) : (
            entries.map((entry) => {
              const isTop3 = entry.rank <= 3;
              const isCurrentUser = normCurrent && entry.username.toLowerCase() === normCurrent;
              const medalColor =
                entry.rank === 1
                  ? "text-amber-400"
                  : entry.rank === 2
                  ? "text-slate-300"
                  : "text-amber-600";

              return (
                <tr
                  key={`${entry.rank}-${entry.username}`}
                  onClick={() => onSelectPlayer?.(entry.username)}
                  className={`transition-colors cursor-pointer group ${
                    isCurrentUser
                      ? "bg-primary/10 border-l-2 border-l-primary hover:bg-primary/15"
                      : "hover:bg-secondary/40"
                  }`}
                  title={`Click to inspect @${entry.username}'s profile summary`}
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
                      <div className="h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] text-primary group-hover:border-primary/50 transition-colors">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
                          {entry.displayName}
                          {isCurrentUser && (
                            <span className="text-[9px] px-1 rounded bg-primary/20 text-primary font-bold">
                              YOU
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-muted-foreground block -mt-0.5">
                          @{entry.username}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-black text-primary text-sm glow-text">
                    {formatNumber(entry.score)}
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
                  <td className="py-3.5 px-4 text-foreground font-semibold">{formatNumber(entry.wpm)} WPM</td>
                  <td className="py-3.5 px-4 text-foreground font-semibold">{formatNumber(entry.accuracy)}%</td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    <span className="text-emerald-400">{entry.cleanPackets}</span> /{" "}
                    <span className="text-rose-400">{entry.corruptedPackets || 0}</span>
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                    {entry.date ? new Date(entry.date).toLocaleDateString() : "Just now"}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlayer?.(entry.username);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-secondary/80 hover:bg-primary/20 text-muted-foreground hover:text-primary border border-border hover:border-primary/40 transition-all font-mono text-[11px] font-bold shadow-sm"
                      title={`Inspect @${entry.username}'s profile & stats`}
                    >
                      <User className="h-3 w-3" />
                      <span>VIEW</span>
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
