"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Award,
  Zap,
  Target,
  Clock,
  Shield,
  Flame,
  Sparkles,
  Lock,
  LogIn,
  UserPlus,
  BarChart2,
  Calendar,
  Gamepad2,
  GitCompare,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { TypoHeatmap } from "@/components/dashboard/TypoHeatmap";
import { ArchetypeCard } from "@/components/dashboard/ArchetypeCard";
import { useAuthStore } from "@/store/useAuthStore";
import { formatNumber, round2 } from "@/lib/utils";

export default function ProfileDashboardPage() {
  const { user, openAuthModal } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<"score" | "wpm" | "accuracy">("score");
  const [graphView, setGraphView] = useState<"filtered" | "compare_difficulty" | "compare_mode">("filtered");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");

  useEffect(() => {
    async function loadStats() {
      try {
        const query = user?.username ? `?username=${encodeURIComponent(user.username)}` : "";
        const res = await fetch(`/api/player/stats${query}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load profile stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  // If user is not logged in, show login barrier
  if (!user) {
    return (
      <div className="container max-w-4xl px-4 py-16 flex flex-col items-center justify-center font-sans">
        <div className="w-full p-8 rounded-2xl border border-primary/30 bg-card/90 backdrop-blur-md text-center shadow-2xl glow-primary">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 text-primary mb-4 glow-primary">
            <Lock className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-3xl font-black font-display tracking-tight text-foreground">
            USER PROFILE & PERFORMANCE STATS
          </h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground max-w-md mx-auto uppercase tracking-wider">
            Log in to view your career statistics, performance improvement curves, and game-by-game scoring breakdowns.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openAuthModal("login")}
              className="flex items-center justify-center gap-2 min-w-[170px] bg-primary text-primary-foreground font-display font-bold px-6 py-3 rounded-xl text-xs hover:opacity-90 transition-all glow-primary tracking-wider"
            >
              <LogIn className="h-4 w-4" />
              LOG IN
            </button>
            <button
              onClick={() => openAuthModal("register")}
              className="flex items-center justify-center gap-2 min-w-[170px] bg-secondary hover:bg-secondary/80 text-foreground font-display font-bold px-6 py-3 rounded-xl text-xs border border-border transition-all tracking-wider"
            >
              <UserPlus className="h-4 w-4 text-primary" />
              REGISTER
            </button>
          </div>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const history = data?.improvementHistory || [];
  const runs = data?.runs || [];

  // Filtered dataset for single-focus curve
  const filteredHistory = history
    .filter((h: any) => {
      if (difficultyFilter !== "all" && h.difficulty !== difficultyFilter) return false;
      if (modeFilter !== "all" && h.mode !== modeFilter) return false;
      return true;
    })
    .map((h: any, idx: number) => ({
      ...h,
      displayGame: idx + 1,
    }));

  // Combined dataset to compare Easy vs Medium vs Hard on one timeline
  const difficultyCompareData = history.map((h: any, idx: number) => {
    const val = chartTab === "score" ? h.score : chartTab === "wpm" ? h.wpm : h.accuracy;
    return {
      game: idx + 1,
      date: h.date,
      difficulty: h.difficulty,
      mode: h.mode,
      easyVal: h.difficulty === "easy" ? val : null,
      mediumVal: h.difficulty === "medium" ? val : null,
      hardVal: h.difficulty === "hard" ? val : null,
    };
  });

  // Combined dataset to compare Classic vs Endless vs Daily on one timeline
  const modeCompareData = history.map((h: any, idx: number) => {
    const val = chartTab === "score" ? h.score : chartTab === "wpm" ? h.wpm : h.accuracy;
    return {
      game: idx + 1,
      date: h.date,
      difficulty: h.difficulty,
      mode: h.mode,
      classicVal: h.mode === "classic" ? val : null,
      endlessVal: h.mode === "endless" ? val : null,
      dailyVal: h.mode === "daily" ? val : null,
    };
  });

  return (
    <div className="container max-w-6xl px-4 py-8 font-sans">
      {/* User Career Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono text-primary font-bold mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            USER PROFILE & CAREER STATS
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-foreground flex items-center gap-3">
            <span>@{user.username}</span>
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-secondary border border-border text-muted-foreground font-normal">
              Level {data?.user?.level || 1}
            </span>
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Registered User: {user.name} // Tracking all arcade runs & probability telemetry
          </p>
        </div>

        <Link
          href="/game"
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display font-bold px-6 py-3 rounded-xl text-xs hover:opacity-90 transition-all glow-primary tracking-wider shadow-lg self-start md:self-auto"
        >
          <Gamepad2 className="h-4 w-4" />
          PLAY GAME
        </Link>
      </div>

      {/* Primary Matrices Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {/* Lifetime Score */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md shadow-sm font-mono">
          <div className="flex items-center justify-between text-muted-foreground mb-1 text-[11px] uppercase tracking-wider">
            <span>LIFETIME</span>
            <Award className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground font-display">
            {formatNumber(metrics.lifetimeScore || 0)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Total Points Scored</div>
        </div>

        {/* Best Score */}
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-md shadow-sm font-mono glow-primary">
          <div className="flex items-center justify-between text-primary mb-1 text-[11px] uppercase tracking-wider font-bold">
            <span>BEST SCORE</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-primary font-display glow-text">
            {formatNumber(metrics.bestScore || 0)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Single Run High Score</div>
        </div>

        {/* Average Score */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md shadow-sm font-mono">
          <div className="flex items-center justify-between text-muted-foreground mb-1 text-[11px] uppercase tracking-wider">
            <span>AVG SCORE</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground font-display">
            {formatNumber(metrics.avgScore || 0)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Per Completed Game</div>
        </div>

        {/* WPM Velocity: Best / Avg / Min */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md shadow-sm font-mono">
          <div className="flex items-center justify-between text-muted-foreground mb-1 text-[11px] uppercase tracking-wider">
            <span>WPM SPEED</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-display">
            {formatNumber(metrics.bestWpm || 0)}{" "}
            <span className="text-xs text-muted-foreground font-normal">MAX</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 flex justify-between">
            <span>Avg: {formatNumber(metrics.avgWpm || 0)}</span>
            <span>Min: {formatNumber(metrics.minWpm || 0)}</span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md shadow-sm font-mono">
          <div className="flex items-center justify-between text-muted-foreground mb-1 text-[11px] uppercase tracking-wider">
            <span>ACCURACY</span>
            <Target className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-display">
            {formatNumber(metrics.avgAccuracy || 100)}%
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Best: {formatNumber(metrics.bestAccuracy || 100)}%
          </div>
        </div>

        {/* Games Played */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md shadow-sm font-mono">
          <div className="flex items-center justify-between text-muted-foreground mb-1 text-[11px] uppercase tracking-wider">
            <span>GAMES</span>
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground font-display">
            {metrics.gamesPlayed || 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            🟢 {metrics.totalClean || 0} / 🔴 {metrics.totalCorrupted || 0}
          </div>
        </div>
      </div>

      {/* Player Risk Archetype Classification */}
      <div className="mb-8">
        <ArchetypeCard
          wpm={metrics.avgWpm}
          accuracy={metrics.avgAccuracy}
          dangerRatio={metrics.dangerRatio}
          missedCount={metrics.totalMissed}
        />
      </div>

      {/* Improvement Graph Section */}
      <div className="p-6 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-xl mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold font-display tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              PERFORMANCE IMPROVEMENT CURVE
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Track skill, speed, and accuracy curves over time — isolate or compare across Difficulty and Game Mode
            </p>
          </div>

          {/* Metric Tab Switcher */}
          <div className="flex rounded-lg bg-secondary/80 p-0.5 border border-border font-mono text-xs self-start lg:self-auto">
            <button
              onClick={() => setChartTab("score")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                chartTab === "score"
                  ? "bg-primary text-primary-foreground shadow-sm glow-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Score & EV
            </button>
            <button
              onClick={() => setChartTab("wpm")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                chartTab === "wpm"
                  ? "bg-primary text-primary-foreground shadow-sm glow-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Typing WPM
            </button>
            <button
              onClick={() => setChartTab("accuracy")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                chartTab === "accuracy"
                  ? "bg-primary text-primary-foreground shadow-sm glow-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Accuracy (%)
            </button>
          </div>
        </div>

        {/* Graph View & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-secondary/40 border border-border/60 mb-5 font-mono text-xs">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 font-bold mr-1">
              <Layers className="h-3.5 w-3.5 text-primary" />
              VIEW:
            </span>
            <button
              onClick={() => setGraphView("filtered")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                graphView === "filtered"
                  ? "bg-primary/20 text-primary border border-primary/50 shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground border border-border/40"
              }`}
            >
              Single Trend
            </button>
            <button
              onClick={() => setGraphView("compare_difficulty")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                graphView === "compare_difficulty"
                  ? "bg-amber-400/20 text-amber-400 border border-amber-400/50 shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground border border-border/40"
              }`}
            >
              <GitCompare className="h-3 w-3" />
              Compare Difficulties (4L vs 5L vs 6L)
            </button>
            <button
              onClick={() => setGraphView("compare_mode")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                graphView === "compare_mode"
                  ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400/50 shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground border border-border/40"
              }`}
            >
              <SlidersHorizontal className="h-3 w-3" />
              Compare Modes (Classic vs Endless vs Daily)
            </button>
          </div>

          {/* Difficulty & Mode Filters (active in filtered mode) */}
          {graphView === "filtered" && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Difficulty selector */}
              <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border/50 text-[10px]">
                <button
                  onClick={() => setDifficultyFilter("all")}
                  className={`px-2 py-0.5 rounded ${difficultyFilter === "all" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  All Tiers
                </button>
                <button
                  onClick={() => setDifficultyFilter("easy")}
                  className={`px-2 py-0.5 rounded ${difficultyFilter === "easy" ? "bg-emerald-500 text-black font-bold" : "text-emerald-400 hover:text-foreground"}`}
                >
                  🟢 Easy (4L)
                </button>
                <button
                  onClick={() => setDifficultyFilter("medium")}
                  className={`px-2 py-0.5 rounded ${difficultyFilter === "medium" ? "bg-amber-500 text-black font-bold" : "text-amber-400 hover:text-foreground"}`}
                >
                  🟡 Medium (5L)
                </button>
                <button
                  onClick={() => setDifficultyFilter("hard")}
                  className={`px-2 py-0.5 rounded ${difficultyFilter === "hard" ? "bg-rose-500 text-white font-bold" : "text-rose-400 hover:text-foreground"}`}
                >
                  🔴 Hard (6L)
                </button>
              </div>

              {/* Mode selector */}
              <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border/50 text-[10px]">
                <button
                  onClick={() => setModeFilter("all")}
                  className={`px-2 py-0.5 rounded ${modeFilter === "all" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  All Modes
                </button>
                <button
                  onClick={() => setModeFilter("classic")}
                  className={`px-2 py-0.5 rounded ${modeFilter === "classic" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Classic
                </button>
                <button
                  onClick={() => setModeFilter("endless")}
                  className={`px-2 py-0.5 rounded ${modeFilter === "endless" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Endless
                </button>
                <button
                  onClick={() => setModeFilter("daily")}
                  className={`px-2 py-0.5 rounded ${modeFilter === "daily" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Daily
                </button>
              </div>
            </div>
          )}
        </div>

        {history.length > 0 ? (
          <div className="h-72 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              {graphView === "compare_difficulty" ? (
                /* Multi-Difficulty Comparison Graph */
                <LineChart data={difficultyCompareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="game" stroke="#888" tickLine={false} label={{ value: "Game #", position: "insideBottom", offset: -5 }} />
                  <YAxis stroke="#888" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 15, 25, 0.95)",
                      borderColor: "rgba(251, 191, 36, 0.4)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Line
                    type="monotone"
                    dataKey="easyVal"
                    name="🟢 Easy (4-letter words)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    connectNulls={true}
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mediumVal"
                    name="🟡 Medium (5-letter words)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    connectNulls={true}
                    dot={{ fill: "#f59e0b", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hardVal"
                    name="🔴 Hard (6-letter words)"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    connectNulls={true}
                    dot={{ fill: "#f43f5e", r: 4 }}
                  />
                </LineChart>
              ) : graphView === "compare_mode" ? (
                /* Multi-Mode Comparison Graph */
                <LineChart data={modeCompareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="game" stroke="#888" tickLine={false} label={{ value: "Game #", position: "insideBottom", offset: -5 }} />
                  <YAxis stroke="#888" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 15, 25, 0.95)",
                      borderColor: "rgba(0, 240, 255, 0.4)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Line
                    type="monotone"
                    dataKey="classicVal"
                    name="⚡ Classic (90s Sprint)"
                    stroke="#00f0ff"
                    strokeWidth={2.5}
                    connectNulls={true}
                    dot={{ fill: "#00f0ff", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="endlessVal"
                    name="🛡️ Endless (Survival)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    connectNulls={true}
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="dailyVal"
                    name="✨ Daily Challenge"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    connectNulls={true}
                    dot={{ fill: "#f59e0b", r: 4 }}
                  />
                </LineChart>
              ) : filteredHistory.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-mono">
                  No games recorded matching the selected Difficulty and Mode filters.
                </div>
              ) : chartTab === "score" ? (
                /* Single Filtered Trend: Score & EV */
                <AreaChart data={filteredHistory}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="displayGame" stroke="#888" tickLine={false} label={{ value: "Game #", position: "insideBottom", offset: -5 }} />
                  <YAxis stroke="#888" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 15, 25, 0.95)",
                      borderColor: "rgba(0, 240, 255, 0.4)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    name="Realized Score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scoreGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="expected"
                    name="Expected (EV)"
                    stroke="#a855f7"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </AreaChart>
              ) : chartTab === "wpm" ? (
                /* Single Filtered Trend: Typing WPM */
                <LineChart data={filteredHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="displayGame" stroke="#888" tickLine={false} label={{ value: "Game #", position: "insideBottom", offset: -5 }} />
                  <YAxis stroke="#888" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 15, 25, 0.95)",
                      borderColor: "rgba(251, 191, 36, 0.4)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="wpm"
                    name="Typing WPM"
                    stroke="#fbbf24"
                    strokeWidth={2.5}
                    dot={{ fill: "#fbbf24", r: 4 }}
                  />
                </LineChart>
              ) : (
                /* Single Filtered Trend: Accuracy % */
                <LineChart data={filteredHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="displayGame" stroke="#888" tickLine={false} label={{ value: "Game #", position: "insideBottom", offset: -5 }} />
                  <YAxis domain={[50, 100]} stroke="#888" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 15, 25, 0.95)",
                      borderColor: "rgba(52, 211, 153, 0.4)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    name="Accuracy %"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    dot={{ fill: "#34d399", r: 4 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-xs font-mono text-muted-foreground">
            Play games to generate your improvement trajectory graph!
          </div>
        )}
      </div>

      {/* Interactive QWERTY Typo Heatmap */}
      <div className="mb-8">
        <TypoHeatmap
          typoMap={metrics.typoMap}
          totalKeystrokes={metrics.lifetimeScore}
        />
      </div>

      {/* Game-by-Game Breakdown Table */}
      <div className="p-6 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-xl font-mono">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold font-display tracking-tight text-foreground flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              GAME BREAKDOWN & SCORE DECOMPOSITION
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comprehensive breakdown for each game: Base, Multiplier Streaks, Speed Bonuses, and Luck Variance
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{runs.length} runs recorded</span>
        </div>

        {runs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-[10px] text-muted-foreground uppercase tracking-wider">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3 text-foreground font-bold">Pure Typing</th>
                  <th className="py-2.5 px-3 text-amber-400">Multiplier</th>
                  <th className="py-2.5 px-3 text-primary">Speed Bonus</th>
                  <th className="py-2.5 px-3 text-foreground font-black">Total Score</th>
                  <th className="py-2.5 px-3 text-muted-foreground">Expected (EV)</th>
                  <th className="py-2.5 px-3">Luck (Variance)</th>
                  <th className="py-2.5 px-3">WPM / ACC</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {runs.map((r: any) => (
                  <tr key={r.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="py-3 px-3 text-muted-foreground font-bold">{r.gameIndex}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary border border-border uppercase">
                          {r.mode}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            r.difficulty === "easy"
                              ? "text-emerald-400"
                              : r.difficulty === "medium"
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {r.difficulty.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-foreground font-bold font-mono">
                      {formatNumber(r.actualTypingScore ?? r.baseScore)} PTS
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-bold font-mono">
                      +{formatNumber(r.multiplierScore)}
                    </td>
                    <td className="py-3 px-3 text-primary font-bold font-mono">
                      +{formatNumber(r.bonusScore)}
                    </td>
                    <td className="py-3 px-3 font-black text-foreground font-display text-sm">
                      {formatNumber(r.finalScore)} PTS
                    </td>
                    <td className="py-3 px-3 text-muted-foreground font-mono">
                      {formatNumber(r.expectedScore)} PTS
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold font-mono ${
                          r.luckScore >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                        title="Calculated strictly as Pure Typing Score - Expected (EV)"
                      >
                        {r.luckScore >= 0 ? `+${formatNumber(r.luckScore)}` : formatNumber(r.luckScore)} PTS
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-amber-400 font-bold">{formatNumber(r.wpm)}</span> /{" "}
                      <span className="text-emerald-400 font-bold">{formatNumber(r.accuracy)}%</span>
                    </td>
                    <td className="py-3 px-3 text-right text-muted-foreground text-[11px]">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No games recorded yet. Play a run to see your score breakdowns!
          </div>
        )}
      </div>
    </div>
  );
}
