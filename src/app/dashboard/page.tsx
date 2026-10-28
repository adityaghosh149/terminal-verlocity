"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Award,
  Zap,
  Shield,
  Activity,
  Terminal,
  Clock,
  ArrowRight,
  BookOpen,
  Info,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";
import { ProbabilityEngine } from "@/lib/probability/engine";

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
    ? lastRunResult.events.map((e, idx) => {
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 font-mono">
        <div className="p-4 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md">
          <div className="text-[11px] text-muted-foreground uppercase flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-400" />
            LIFETIME SCORE
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {playerStats?.user?.lifetimeScore?.toLocaleString() || (user ? user.lifetimeScore.toLocaleString() : "0")}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Best Run: {playerStats?.user?.bestScore?.toLocaleString() || (user ? user.bestScore.toLocaleString() : "0")} PTS
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md">
          <div className="text-[11px] text-muted-foreground uppercase flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-primary" />
            TYPING VELOCITY
          </div>
          <div className="text-2xl font-black text-primary glow-text mt-1">
            {playerStats?.user?.bestWpm || (user ? user.bestWpm : 0)} WPM
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Avg Accuracy: {playerStats?.user?.avgAccuracy || (user ? user.avgAccuracy : 100)}%
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md">
          <div className="text-[11px] text-muted-foreground uppercase flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-emerald-400" />
            CLEAN INTERCEPTIONS
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {playerStats?.user?.packetsClean?.toLocaleString() || (user ? user.packetsClean.toLocaleString() : "0")}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Corrupted: {playerStats?.user?.packetsCorrupted || (user ? user.packetsCorrupted : 0)}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md">
          <div className="text-[11px] text-muted-foreground uppercase flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-purple-400" />
            GAMES DEPLOYED
          </div>
          <div className="text-2xl font-black text-purple-400 mt-1">
            {playerStats?.user?.gamesPlayed || (user ? user.gamesPlayed : 0)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Operative Level {playerStats?.user?.level || (user ? user.level : 1)}
          </div>
        </div>
      </div>

      {/* Post-Run Probability Analytics Section */}
      {lastRunResult ? (
        <div className="space-y-8">
          {/* Run Summary Banner */}
          <div className="p-6 rounded-xl border border-primary/40 bg-card/80 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4 mb-4">
              <div>
                <span className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider">
                  LATEST RUN TELEMETRY // {lastRunResult.mode.toUpperCase()} ({lastRunResult.difficulty.toUpperCase()})
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
            {/* Chart 1: EV vs Realized Points per Packet */}
            <div className="p-6 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md shadow-xl flex flex-col">
              <h3 className="text-sm font-bold font-mono text-foreground mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                EXPECTED VALUE VS REALIZED POINTS (PER PACKET)
              </h3>
              <p className="text-xs text-muted-foreground mb-4 font-mono">
                Comparison of theoretical EV against realized points on captured packets
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evVsRealizedData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} interval={0} angle={-35} textAnchor="end" />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", fontSize: 12, borderRadius: 8 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="expectedValue" name="Theoretical EV" fill="#00f0ff" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="realizedPoints" name="Realized Points" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Empirical Calibration Curve */}
            <div className="p-6 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md shadow-xl flex flex-col">
              <h3 className="text-sm font-bold font-mono text-foreground mb-1 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-400" />
                EMPIRICAL PROBABILITY CALIBRATION CURVE
              </h3>
              <p className="text-xs text-muted-foreground mb-4 font-mono">
                Theoretical corruption probability vs observed frequency in probability bins
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calibrationData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="bin" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", fontSize: 12, borderRadius: 8 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="expected" name="Theoretical Risk (%)" fill="#ffb703" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="observed" name="Observed Corruption (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart 3: Cumulative Score Progression Timeline */}
          <div className="p-6 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md shadow-xl">
            <h3 className="text-sm font-bold font-mono text-foreground mb-1 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              RUN SCORE PROGRESSION TIMELINE
            </h3>
            <p className="text-xs text-muted-foreground mb-4 font-mono">
              Cumulative score trajectory over time as packets were intercepted or decayed
            </p>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreProgressionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", fontSize: 12, borderRadius: 8 }}
                  />
                  <Line type="monotone" dataKey="score" name="Cumulative Score" stroke="#a855f7" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md text-center">
          <Terminal className="h-12 w-12 text-primary mx-auto mb-3 animate-pulse" />
          <h2 className="text-xl font-bold font-mono text-foreground">
            NO RECENT RUN TELEMETRY RECORDED
          </h2>
          <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
            Complete an arcade run to generate post-game Data Science calibration curves, expected value distributions, and score progression graphs.
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
      <div className="mt-12 p-6 rounded-xl border border-border/80 bg-card/50 backdrop-blur-md font-mono text-xs">
        <div className="flex items-center gap-2 text-primary font-bold text-sm mb-3">
          <BookOpen className="h-4 w-4" />
          MATHEMATICAL & DATA SCIENCE METHODOLOGY
        </div>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Expected Value (EV):</strong> Computed using{" "}
            <code className="text-primary font-bold">EV = (1 - p)R - pC - K</code> where <code className="text-foreground">p</code> is the corruption probability, <code className="text-foreground">R</code> is the clean packet reward, and <code className="text-foreground">C</code> is the corruption penalty.
          </p>
          <p>
            <strong className="text-foreground">Variance vs Law of Large Numbers:</strong> Over an individual trial, a packet with positive expected value (e.g. +84 PTS) may still roll corrupted and penalize the player. As the sample size <code className="text-foreground">N</code> grows across multiple runs, empirical realized return converges toward mathematical expectation.
          </p>
          <p>
            <strong className="text-foreground">Calibration Interpretation:</strong> Small sample sizes (<code className="text-foreground">N &lt; 20</code>) exhibit natural sampling variance. Binned empirical charts reflect actual observed outcomes without altering underlying true game distributions.
          </p>
        </div>
      </div>
    </div>
  );
}
