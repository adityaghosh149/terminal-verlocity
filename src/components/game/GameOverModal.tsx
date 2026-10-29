"use client";

import React from "react";
import { AlertTriangle, Sparkles, RotateCcw, BarChart2 } from "lucide-react";
import { PacketEvent } from "@/types";
import { getComboMultiplier } from "./types";

interface GameOverModalProps {
  score: number;
  maxCombo: number;
  events: PacketEvent[];
  onPlayAgain: () => void;
  onViewAnalytics: () => void;
}

export function GameOverModal({
  score,
  maxCombo,
  events,
  onPlayAgain,
  onViewAnalytics,
}: GameOverModalProps) {
  const intercepted = events.filter((e) => e.action === "intercepted");
  const totalEV = Math.round(intercepted.reduce((sum, e) => sum + e.expectedValue, 0));
  const realizedPts = intercepted.reduce((sum, e) => sum + e.pointsDelta, 0);
  const deltaEV = realizedPts - totalEV;
  const safeCount = intercepted.filter((e) => e.corruptionProbability < 0.25).length;
  const cautionCount = intercepted.filter(
    (e) => e.corruptionProbability >= 0.25 && e.corruptionProbability < 0.50
  ).length;
  const dangerCount = intercepted.filter((e) => e.corruptionProbability >= 0.50).length;
  const missedCount = events.filter((e) => e.action === "missed").length;
  const corruptedCount = intercepted.filter((e) => e.outcome === "corrupted").length;

  let adviceTag = "BALANCED TACTICAL EXECUTION";
  let adviceText =
    "Steady operational execution across multiple lanes. Maintain rhythm above 60 WPM to handle high-difficulty cascades.";

  if (dangerCount >= 2 && corruptedCount >= 1) {
    adviceTag = "HIGH VARIANCE OVEREXPOSURE";
    adviceText =
      "You targeted high-stakes packets (🔴 Danger) without sufficient shield buffer. Recommendation: Prioritize 🟢 Safe & 🟡 Caution tiers to preserve shields and sustain 3x/4x multipliers.";
  } else if (missedCount >= 2) {
    adviceTag = "FIREWALL VELOCITY BOTTLENECK";
    adviceText =
      "Packets breached the firewall defense line before completion. Recommendation: Prioritize words closest to the defense line, and deploy the [TAB] EMP Defuser during surges.";
  } else if (safeCount > 0 && cautionCount === 0 && dangerCount === 0) {
    adviceTag = "CONSERVATIVE BIAS";
    adviceText =
      "You strictly typed safe packets. While firewall survival was maximized, expected point yield was capped. Recommendation: Target 🟡 Caution packets during active streak combos.";
  } else if (deltaEV >= 0) {
    adviceTag = "OPTIMAL STOCHASTIC EXECUTION";
    adviceText = `Superb risk-reward discipline! Realized score exceeded mathematical expectancy by +${deltaEV} PTS. High streak combo retention mitigated downside variance.`;
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md z-40 p-4 sm:p-6 text-center animate-in zoom-in-95 duration-200 overflow-y-auto">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/30 mb-2 glow-danger shrink-0">
        <AlertTriangle className="h-6 w-6 text-rose-500 animate-bounce" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-rose-500">
        TERMINAL SHUTDOWN
      </h2>
      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
        Firewall depleted or operational timeline concluded
      </p>

      {/* Main Score & Telemetry Box */}
      <div className="mt-3 p-4 rounded-xl bg-card border border-border/80 max-w-lg w-full font-mono text-left shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/40 pb-2.5 mb-2.5">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase">FINAL VALIDATED SCORE</div>
            <div className="text-3xl font-black text-primary glow-text">
              {score.toLocaleString()} PTS
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase">MAX COMBO</div>
            <div className="text-lg font-bold text-amber-400">
              {getComboMultiplier(maxCombo)}x ({maxCombo} streak)
            </div>
          </div>
        </div>

        {/* Data Science Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5 text-xs">
          <div className="p-2 rounded bg-secondary/50 border border-border/40">
            <div className="text-[9px] text-muted-foreground uppercase">REALIZED PTS</div>
            <div className="font-bold text-foreground">{realizedPts}</div>
          </div>
          <div className="p-2 rounded bg-secondary/50 border border-border/40">
            <div className="text-[9px] text-muted-foreground uppercase">EXPECTED EV</div>
            <div className="font-bold text-primary">+{totalEV}</div>
          </div>
          <div className="p-2 rounded bg-secondary/50 border border-border/40">
            <div className="text-[9px] text-muted-foreground uppercase">Δ EV VARIANCE</div>
            <div className={`font-bold ${deltaEV >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {deltaEV >= 0 ? `+${deltaEV}` : deltaEV}
            </div>
          </div>
          <div className="p-2 rounded bg-secondary/50 border border-border/40">
            <div className="text-[9px] text-muted-foreground uppercase">MISSED / TRAPS</div>
            <div className="font-bold text-rose-400">
              {missedCount} / {corruptedCount}
            </div>
          </div>
        </div>

        {/* Risk Distribution Tiers */}
        <div className="p-2 rounded bg-secondary/30 border border-border/40 mb-2.5 text-[11px] flex flex-wrap items-center justify-between gap-1">
          <span className="text-muted-foreground text-[10px]">RISK CAPTURED:</span>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold">🟢 Safe: {safeCount}</span>
            <span className="text-amber-400 font-bold">🟡 Caution: {cautionCount}</span>
            <span className="text-rose-400 font-bold">🔴 Danger: {dangerCount}</span>
          </div>
        </div>

        {/* Data Science Tactical Recommendation */}
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 text-[11px]">
          <div className="flex items-center gap-1.5 text-primary font-bold mb-1 uppercase tracking-wider text-[10px]">
            <Sparkles className="h-3.5 w-3.5" />
            DATA SCIENCE INSIGHT: {adviceTag}
          </div>
          <p className="text-muted-foreground font-sans text-xs leading-relaxed">{adviceText}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={(e) => {
            e.currentTarget.blur();
            onPlayAgain();
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-display font-bold px-6 py-2.5 rounded-lg text-xs hover:opacity-90 transition-all glow-primary"
        >
          <RotateCcw className="h-4 w-4" />
          PLAY AGAIN [SPACE]
        </button>
        <button
          onClick={onViewAnalytics}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-display font-medium px-5 py-2.5 rounded-lg text-xs border border-border transition-all"
        >
          <BarChart2 className="h-4 w-4 text-primary" />
          VIEW DATA SCIENCE ANALYTICS
        </button>
      </div>
    </div>
  );
}
