"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Terminal, TrendingUp, Cpu, User } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";
import { useGameStore } from "@/store/useGameStore";
import { ProbabilityEngine } from "@/lib/probability/engine";

import { LifetimeStatsGrid } from "@/components/dashboard/LifetimeStatsGrid";
import { EvVsRealizedChart } from "@/components/dashboard/EvVsRealizedChart";
import { CalibrationChart } from "@/components/dashboard/CalibrationChart";
import { ScoreTimelineChart } from "@/components/dashboard/ScoreTimelineChart";
import { MethodologyCard } from "@/components/dashboard/MethodologyCard";

export default function DashboardPage() {
  const { username, openCallsignModal } = useSessionStore();
  const { lastRunResult } = useGameStore();

  const [playerStats, setPlayerStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeChartTab, setActiveChartTab] = useState<"timeline" | "probability">("timeline");

  useEffect(() => {
    async function loadStats() {
      try {
        const query = username ? `?username=${encodeURIComponent(username)}` : "";
        const res = await fetch(`/api/player/stats${query}`);
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
  }, [username]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono text-primary mb-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            ANALYTICS & STATS
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tight text-foreground">
            {username ? `@${username} // DASHBOARD` : "STATS DASHBOARD"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {!username && (
            <button
              onClick={openCallsignModal}
              className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-mono font-bold px-4 py-2.5 rounded-lg text-xs border border-border transition-all"
            >
              <User className="h-4 w-4 text-primary" />
              SET USERNAME
            </button>
          )}
          <Link
            href="/game"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono font-bold px-5 py-2.5 rounded-lg text-xs hover:opacity-90 transition-all glow-primary"
          >
            <Terminal className="h-4 w-4" />
            PLAY GAME
          </Link>
        </div>
      </div>

      {/* Lifetime / Session Stat Cards */}
      <LifetimeStatsGrid playerStats={playerStats} user={playerStats?.user || null} />

      {/* Post-Run Probability Analytics Section */}
      {lastRunResult ? (
        <div className="space-y-6">
          {/* Run Summary Banner */}
          <div className="p-5 rounded-xl border border-primary/40 bg-card/80 backdrop-blur-md shadow-xl relative overflow-hidden font-mono">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/60 pb-3 mb-3">
              <div>
                <span className="text-[11px] text-primary font-bold uppercase tracking-wider">
                  LATEST RUN // {lastRunResult.mode.toUpperCase()} ({lastRunResult.difficulty.toUpperCase()})
                </span>
                <div className="text-2xl font-black text-primary glow-text mt-0.5">
                  FINAL SCORE: {lastRunResult.finalScore.toLocaleString()} PTS
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
                <div className="text-muted-foreground text-[11px]">EXPECTED VALUE (EV)</div>
                <div className="text-lg font-bold text-foreground mt-0.5">
                  {lastRunResult.totalExpectedValue.toLocaleString()} PTS
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
                <div className="text-muted-foreground text-[11px]">REALIZED SCORE</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">
                  {lastRunResult.totalRealizedScore.toLocaleString()} PTS
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
                <div className="text-muted-foreground text-[11px]">VARIANCE (LUCK)</div>
                <div
                  className={`text-lg font-bold mt-0.5 ${
                    lastRunResult.totalRealizedScore >= lastRunResult.totalExpectedValue
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {(lastRunResult.totalRealizedScore - lastRunResult.totalExpectedValue).toFixed(1)} PTS
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Tabs: Score Timeline vs Probability Analysis */}
          <div className="flex items-center gap-2 border-b border-border/80 pb-2 font-mono text-xs">
            <button
              onClick={() => setActiveChartTab("timeline")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all ${
                activeChartTab === "timeline"
                  ? "bg-primary text-primary-foreground shadow-sm glow-primary"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Score Timeline
            </button>

            <button
              onClick={() => setActiveChartTab("probability")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all ${
                activeChartTab === "probability"
                  ? "bg-primary text-primary-foreground shadow-sm glow-primary"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Cpu className="h-4 w-4" />
              Probability Analysis
            </button>
          </div>

          {/* Tab 1: Real-Time Score Progression Timeline */}
          {activeChartTab === "timeline" && (
            <ScoreTimelineChart data={scoreProgressionData} />
          )}

          {/* Tab 2: Probability Analysis (EV Bar Chart + Calibration Curve) */}
          {activeChartTab === "probability" && (
            <div className="space-y-6">
              <EvVsRealizedChart data={evVsRealizedData} />
              <CalibrationChart data={calibrationData} />
            </div>
          )}
        </div>
      ) : (
        <div className="p-10 text-center rounded-xl border border-dashed border-border/80 bg-card/40 backdrop-blur-md">
          <Terminal className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-base font-bold font-mono text-foreground">
            NO RECENT RUN RECORDED
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-5 font-sans">
            Play a game to view score progression timelines and probability calibration curves.
          </p>
          <Link
            href="/game"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono font-bold px-5 py-2 rounded-lg text-xs hover:opacity-90 transition-all glow-primary"
          >
            PLAY NOW
          </Link>
        </div>
      )}

      {/* Expandable Methodology Section */}
      <MethodologyCard />
    </div>
  );
}
