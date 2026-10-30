"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  X,
  User,
  Trophy,
  Zap,
  Target,
  Shield,
  Dices,
  Sparkles,
  BarChart2,
  Calendar,
  CheckCircle2,
  Loader2,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { formatNumber, round2 } from "@/lib/utils";

interface PlayerProfileModalProps {
  username: string;
  onClose: () => void;
  isSelf?: boolean;
}

interface PlayerStatsPayload {
  user: {
    username: string;
    displayName: string;
    level: number;
  };
  metrics: {
    lifetimeScore: number;
    bestScore: number;
    avgScore: number;
    bestWpm: number;
    avgWpm: number;
    minWpm: number;
    bestAccuracy: number;
    avgAccuracy: number;
    gamesPlayed: number;
    totalClean: number;
    totalCorrupted: number;
    totalMissed: number;
    dangerRatio?: number;
  };
  runs: Array<{
    runId: string;
    mode: string;
    difficulty: string;
    finalScore: number;
    wpm: number;
    accuracy: number;
    createdAt: string;
  }>;
}

interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export function PlayerProfileModal({
  username,
  onClose,
  isSelf = false,
}: PlayerProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PlayerStatsPayload | null>(null);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  // Fetch telemetry & achievements for target player
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const loadPlayerDetails = async () => {
      try {
        const [statsRes, achRes] = await Promise.all([
          fetch(`/api/player/stats?username=${encodeURIComponent(username)}`),
          fetch(`/api/player/achievements?username=${encodeURIComponent(username)}`),
        ]);

        if (!cancelled && statsRes.ok) {
          const statsJson = await statsRes.json();
          setData(statsJson);
        }

        if (!cancelled && achRes.ok) {
          const achJson = await achRes.json();
          setAchievements(achJson.achievements || []);
        }
      } catch (err) {
        console.error("Player profile fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPlayerDetails();
    return () => {
      cancelled = true;
    };
  }, [username]);

  // Derive behavioral archetype
  const getArchetype = (m: PlayerStatsPayload["metrics"]) => {
    if (m.avgAccuracy >= 98 && m.totalMissed === 0) {
      return {
        title: "The Zen Master",
        icon: Sparkles,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        desc: "Flawless typing execution with near-zero mistakes.",
      };
    }
    if ((m.dangerRatio || 0) >= 0.25) {
      return {
        title: "The High Roller",
        icon: Dices,
        color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        desc: "Aggressive gambler chasing high-EV danger packets.",
      };
    }
    if (m.bestWpm >= 95 || m.avgWpm >= 80) {
      return {
        title: "The Speed Demon",
        icon: Zap,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        desc: "Ultra-fast keystroke velocity leveraging speed bonuses.",
      };
    }
    return {
      title: "The Calculated Strategist",
      icon: Shield,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      desc: "Disciplined player prioritizing steady, safe returns.",
    };
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-primary/40 bg-card shadow-2xl font-sans text-foreground flex flex-col">
        {/* Header Bar */}
        <div className="p-5 border-b border-border/80 bg-secondary/30 relative flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-display font-black text-xl shadow-sm glow-primary shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-foreground">
                  {data?.user?.displayName || username}
                </h3>
                {isSelf && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono font-bold">
                    YOU
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-mono font-bold">
                  LVL {data?.user?.level || 1}
                </span>
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                @{username}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Close profile summary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground font-mono text-xs">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
              Retrieving runner profile telemetry...
            </div>
          ) : !data || !data.metrics ? (
            <div className="py-12 text-center text-muted-foreground font-mono text-xs">
              No historical telemetry found for @{username}.
            </div>
          ) : (
            <>
              {/* Behavioral Archetype Banner */}
              {(() => {
                const arch = getArchetype(data.metrics);
                const Icon = arch.icon;
                return (
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${arch.color}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-5 w-5 shrink-0" />
                      <div>
                        <div className="font-display font-bold text-xs uppercase tracking-wider">
                          {arch.title}
                        </div>
                        <div className="text-[11px] opacity-80 font-mono mt-0.5">
                          {arch.desc}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 4 Core Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-center">
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80">
                  <div className="text-[10px] text-muted-foreground uppercase">
                    PERSONAL BEST
                  </div>
                  <div className="text-lg font-black text-primary glow-text mt-0.5">
                    {formatNumber(data.metrics.bestScore)}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    Avg: {formatNumber(data.metrics.avgScore)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80">
                  <div className="text-[10px] text-muted-foreground uppercase">
                    TYPING VELOCITY
                  </div>
                  <div className="text-lg font-black text-amber-400 mt-0.5">
                    {formatNumber(data.metrics.bestWpm)} WPM
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    Avg: {formatNumber(data.metrics.avgWpm)} WPM
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80">
                  <div className="text-[10px] text-muted-foreground uppercase">
                    PRECISION ACC
                  </div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">
                    {formatNumber(data.metrics.bestAccuracy)}%
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    Avg: {formatNumber(data.metrics.avgAccuracy)}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80">
                  <div className="text-[10px] text-muted-foreground uppercase">
                    RUNS PLAYED
                  </div>
                  <div className="text-lg font-black text-foreground mt-0.5">
                    {data.metrics.gamesPlayed}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    Completed Runs
                  </div>
                </div>
              </div>

              {/* Combat Decryption Stats */}
              <div className="p-3.5 rounded-xl bg-secondary/25 border border-border/80 font-mono text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    PACKET INTERCEPTION ACCURACY
                  </span>
                  <span className="font-bold text-foreground">
                    {formatNumber(data.metrics.totalClean)} Clean /{" "}
                    {formatNumber(data.metrics.totalCorrupted)} Corrupted
                  </span>
                </div>
                {/* Visual Ratio Bar */}
                {(() => {
                  const total =
                    (data.metrics.totalClean || 0) +
                    (data.metrics.totalCorrupted || 0);
                  const cleanPct =
                    total > 0
                      ? round2(((data.metrics.totalClean || 0) / total) * 100)
                      : 100;
                  return (
                    <div className="w-full h-2 rounded-full bg-rose-500/30 overflow-hidden flex">
                      <div
                        style={{ width: `${cleanPct}%` }}
                        className="h-full bg-emerald-400 transition-all duration-300"
                        title={`${cleanPct}% Clean Success Rate`}
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Recent Operations */}
              <div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2 flex items-center justify-between">
                  <span>RECENT MISSIONS</span>
                  <span>LATEST 4 RUNS</span>
                </div>
                {data.runs && data.runs.length > 0 ? (
                  <div className="space-y-1.5 font-mono text-xs">
                    {data.runs.slice(0, 4).map((r) => (
                      <div
                        key={r.runId}
                        className="p-2.5 rounded-lg bg-secondary/40 border border-border/60 flex items-center justify-between hover:bg-secondary/60 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              r.difficulty === "easy"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : r.difficulty === "medium"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {r.difficulty}
                          </span>
                          <span className="uppercase text-[11px] font-bold text-foreground">
                            {r.mode}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {r.createdAt
                              ? new Date(r.createdAt).toLocaleDateString()
                              : "Recent"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">
                            {formatNumber(r.wpm)} WPM
                          </span>
                          <span className="text-muted-foreground">
                            {formatNumber(r.accuracy)}%
                          </span>
                          <span className="font-bold text-primary">
                            {formatNumber(r.finalScore)} PTS
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground font-mono">
                    No recent runs available.
                  </div>
                )}
              </div>

              {/* Trophies & Milestones */}
              {achievements.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
                    UNLOCKED TROPHIES (
                    {achievements.filter((a) => a.isUnlocked).length} /{" "}
                    {achievements.length})
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {achievements.map((ach) => (
                      <div
                        key={ach.id}
                        className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                          ach.isUnlocked
                            ? "bg-amber-500/10 border-amber-500/40 text-foreground"
                            : "bg-secondary/20 border-border/40 text-muted-foreground opacity-60"
                        }`}
                      >
                        <div
                          className={`h-6 w-6 rounded flex items-center justify-center shrink-0 ${
                            ach.isUnlocked
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {ach.isUnlocked ? (
                            <Trophy className="h-3.5 w-3.5" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold font-display text-[11px] truncate">
                            {ach.title}
                          </div>
                          <div className="text-[9px] text-muted-foreground truncate">
                            {ach.isUnlocked ? "Unlocked" : "Locked"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/80 bg-secondary/20 flex items-center justify-between">
          <div className="text-[11px] font-mono text-muted-foreground">
            Runner Telemetry Profile // {username}
          </div>
          <div className="flex items-center gap-2">
            {isSelf && (
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-mono font-bold text-foreground hover:bg-secondary/80 transition-all"
              >
                <span>FULL DASHBOARD</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
            <button
              onClick={onClose}
              className="bg-primary text-primary-foreground font-display font-bold px-5 py-1.5 rounded-lg text-xs hover:opacity-90 transition-all glow-primary shadow"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return mounted && typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
