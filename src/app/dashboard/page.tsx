"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Terminal, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";
import { ProbabilityEngine } from "@/lib/probability/engine";

import { LifetimeStatsGrid } from "@/components/dashboard/LifetimeStatsGrid";
import { EvVsRealizedChart } from "@/components/dashboard/EvVsRealizedChart";
import { CalibrationChart } from "@/components/dashboard/CalibrationChart";
import { ScoreTimelineChart } from "@/components/dashboard/ScoreTimelineChart";
import { MethodologyCard } from "@/components/dashboard/MethodologyCard";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { lastRunResult } = useGameStore();

  const [playerStats, setPlayerStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/player/stats");
        if (res.ok) {
          const data = await res.json();
          setPlayerStats(data);
        }
      } catch (err) {
        console.error("Stats load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [isAuthenticated]);

  // Prepare Calibration Curve Data (Empirical vs Theoretical Binned)
  const calibrationData = lastRunResult?.events
    ? ProbabilityEngine.computeCalibrationBins(lastRunResult.events, 5).map((b) => ({
        bin: b.binLabel,
        expected: Math.round(b.expectedCorruptionRate * 100),
        observed: Math.round(b.observedCorruptionRate * 100),
        samples: b.sampleSize,
      }))
    : [];

  // Prepare EV vs Realized Points Data per Packet
  const evVsRealizedData = lastRunResult?.events
    ? lastRunResult.events
        .filter((e) => e.action === "intercepted")
        .slice(0, 15)
        .map((e, idx) => ({
          name: `#${idx + 1} ${e.code}`,
          expectedValue: e.expectedValue,
          realizedPoints: e.pointsDelta,
        }))
    : [];

  // Prepare Timeline Score Progression Data
  let runningScore = 0;
  const scoreProgressionData = lastRunResult?.events
    ? lastRunResult.events.map((e) => {
        runningScore += e.pointsDelta || 0;
        return {
          time: `${Math.round(e.timestampMs / 1000)}s`,
          score: runningScore,
        };
      })
    : [];

  return (
    <div className="container max-w-6xl px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono text-primary mb-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            OPERATIVE DATA SCIENCE TELEMETRY
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tight text-foreground">
            {user ? `${user.displayName.toUpperCase()} // DASHBOARD` : "TELEMETRY DASHBOARD"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Empirical probability analysis, expected value variance, and lifetime combat records
          </p>
        </div>

        <Link
          href="/game"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono font-bold px-6 py-2.5 rounded-lg text-xs hover:opacity-90 transition-all glow-primary"
        >
          <Terminal className="h-4 w-4" />
          START NEW RUN
        </Link>
      </div>

      {/* Lifetime Stat Cards */}
      <LifetimeStatsGrid playerStats={playerStats} user={user} />

      {/* Post-Run Probability Analytics Section */}
      {lastRunResult ? (
        <div className="space-y-8">
          {/* Run Summary Banner */}
          <div className="p-6 rounded-xl border border-primary/40 bg-card/80 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4 mb-4">
              <div>
                <span className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider">
                  LATEST RUN TELEMETRY // {lastRunResult.mode.toUpperCase()} (
                  {lastRunResult.difficulty.toUpperCase()})
                </span>
                <div className="text-3xl font-black font-mono text-primary glow-text mt-1">
                  FINAL SCORE: {lastRunResult.finalScore.toLocaleString()} PTS
                </div>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="p-2 rounded bg-secondary/80 border border-border">
                  DURATION: <span className="text-foreground font-bold">{lastRunResult.durationSeconds}s</span>
                </div>
                <div className="p-2 rounded bg-secondary/80 border border-border">
                  SPEED: <span className="text-foreground font-bold">{lastRunResult.wpm} WPM</span>
                </div>
                <div className="p-2 rounded bg-secondary/80 border border-border">
                  ACCURACY: <span className="text-foreground font-bold">{lastRunResult.accuracy}%</span>
                </div>
              </div>
            </div>

            {/* Run Expected Value vs Realized Score Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
                <div className="text-muted-foreground">THEORETICAL EXPECTED VALUE (EV)</div>
                <div className="text-xl font-bold text-foreground mt-1">
                  {lastRunResult.totalExpectedValue.toLocaleString()} PTS
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Mathematical expectation over all captured packets
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
                <div className="text-muted-foreground">REALIZED OUTCOME</div>
                <div className="text-xl font-bold text-primary mt-1">
                  {lastRunResult.totalRealizedScore.toLocaleString()} PTS
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Points earned net of corruption penalties
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
                <div className="text-muted-foreground">SAMPLE VARIANCE / SPREAD</div>
                <div
                  className={`text-xl font-bold mt-1 ${
                    lastRunResult.totalRealizedScore >= lastRunResult.totalExpectedValue
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {lastRunResult.totalRealizedScore >= lastRunResult.totalExpectedValue ? "+" : ""}
                  {(lastRunResult.totalRealizedScore - lastRunResult.totalExpectedValue).toFixed(1)} PTS
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Realized divergence from theoretical EV
                </div>
              </div>
            </div>
          </div>

          {/* Chart 1 & Chart 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <EvVsRealizedChart data={evVsRealizedData} />
            <CalibrationChart data={calibrationData} />
          </div>

          {/* Chart 3: Cumulative Score Progression Timeline */}
          <ScoreTimelineChart data={scoreProgressionData} />
        </div>
      ) : (
        <div className="p-12 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md text-center">
          <Terminal className="h-12 w-12 text-primary mx-auto mb-3 animate-pulse" />
          <h2 className="text-xl font-bold font-mono text-foreground">
            NO RECENT RUN TELEMETRY RECORDED
          </h2>
          <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
            Complete an arcade run to generate post-game Data Science calibration curves, expected
            value distributions, and score progression graphs.
          </p>
          <Link
            href="/game"
            className="inline-flex items-center gap-2 mt-6 bg-primary text-primary-foreground font-mono font-bold px-6 py-2.5 rounded-lg text-xs hover:opacity-90 transition-all glow-primary"
          >
            LAUNCH ARCADE MISSION
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Educational Data Science Analysis Card */}
      <MethodologyCard />
    </div>
  );
}
