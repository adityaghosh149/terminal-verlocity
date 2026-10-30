"use client";

import React from "react";
import { AlertTriangle, RotateCcw, BarChart2 } from "lucide-react";
import { PacketEvent } from "@/types";
import { getComboMultiplier } from "./types";
import { round2, formatNumber } from "@/lib/utils";

interface GameOverModalProps {
  score: number;
  maxCombo: number;
  events: PacketEvent[];
  accuracy?: number;
  rawTypingScore?: number;
  accuracyPenaltyPct?: number;
  accuracyPenaltyScore?: number;
  onPlayAgain: () => void;
  onViewAnalytics: () => void;
}

export function GameOverModal({
  score,
  maxCombo,
  events,
  accuracy,
  rawTypingScore,
  accuracyPenaltyPct,
  accuracyPenaltyScore,
  onPlayAgain,
  onViewAnalytics,
}: GameOverModalProps) {
  const intercepted = events.filter((e) => e.action === "intercepted");
  const totalEV = round2(intercepted.reduce((sum, e) => sum + e.expectedValue, 0));

  let pureTyping = 0;
  let multiplierPts = 0;
  let speedBonusPts = 0;

  for (const e of events) {
    if (e.action === "intercepted") {
      pureTyping += e.pureTypingPoints !== undefined
        ? e.pureTypingPoints
        : (e.outcome === "clean" ? e.reward : -e.corruptionPenalty);
      multiplierPts += e.multiplierPoints || 0;
      speedBonusPts += e.speedBonusPoints || 0;
    } else if (e.action === "missed") {
      pureTyping += e.pointsDelta || 0;
    }
  }

  pureTyping = round2(pureTyping);
  multiplierPts = round2(multiplierPts);
  speedBonusPts = round2(speedBonusPts);
  const roundedScore = round2(score);

  // Accuracy Penalty: (2 * (100 - accuracy))% on true typing score
  const accuracyVal = typeof accuracy === "number" ? accuracy : 100;
  const errorRate = Math.max(0, 100 - accuracyVal);
  const computedPenaltyPct = round2(accuracyPenaltyPct ?? Math.min(100, 2 * errorRate));
  const baseTyping = round2(rawTypingScore ?? pureTyping);
  const penaltyAmount = round2(accuracyPenaltyScore ?? Math.max(0, baseTyping * (computedPenaltyPct / 100)));
  const netTyping = round2(baseTyping - penaltyAmount);

  // Guarantee exact invariant: finalNetTyping + multiplierPts + speedBonusPts === roundedScore
  const diff = round2(roundedScore - (netTyping + multiplierPts + speedBonusPts));
  const finalNetTyping = round2(netTyping + diff);

  // Rule: luck is calculated using expected EV and net pure typing score, NOT the total score
  const luckScore = round2(finalNetTyping - totalEV);

  const safeCount = intercepted.filter((e) => e.corruptionProbability < 0.25).length;
  const cautionCount = intercepted.filter(
    (e) => e.corruptionProbability >= 0.25 && e.corruptionProbability < 0.50
  ).length;
  const dangerCount = intercepted.filter((e) => e.corruptionProbability >= 0.50).length;
  const missedCount = events.filter((e) => e.action === "missed").length;
  const corruptedCount = intercepted.filter((e) => e.outcome === "corrupted").length;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md z-40 p-4 sm:p-6 text-center animate-in zoom-in-95 duration-200 overflow-y-auto">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/30 mb-2 glow-danger shrink-0">
        <AlertTriangle className="h-6 w-6 text-rose-500 animate-bounce" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-rose-500">
        GAME OVER
      </h2>
      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
        All shields depleted or time expired
      </p>

      {/* Main Score Box */}
      <div className="mt-3 p-4 rounded-xl bg-card border border-border/80 max-w-lg w-full font-mono text-left shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/40 pb-2.5 mb-2.5">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase">FINAL SCORE</div>
            <div className="text-3xl font-black text-primary glow-text">
              {formatNumber(roundedScore)} PTS
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase">MAX COMBO</div>
            <div className="text-lg font-bold text-amber-400">
              {getComboMultiplier(maxCombo)}x ({maxCombo} streak)
            </div>
          </div>
        </div>

        {/* Detailed Score Decomposition Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 text-xs">
          <div className="p-2 rounded bg-secondary/50 border border-border/40">
            <div className="text-[9px] text-muted-foreground uppercase">BASE TYPING</div>
            <div className="font-bold text-foreground">+{formatNumber(baseTyping)}</div>
          </div>
          <div className={`p-2 rounded border border-border/40 ${computedPenaltyPct > 0 ? "bg-rose-950/30 border-rose-500/40" : "bg-emerald-950/20 border-emerald-500/30"}`}>
            <div className="text-[9px] text-muted-foreground uppercase">ACCURACY PENALTY</div>
            <div className={`font-bold ${computedPenaltyPct > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {computedPenaltyPct > 0 ? `-${computedPenaltyPct}% (-${formatNumber(penaltyAmount)})` : "0% (NONE)"}
            </div>
          </div>
          <div className="p-2 rounded bg-secondary/50 border border-border/40">
            <div className="text-[9px] text-muted-foreground uppercase">MULTIPLIER</div>
            <div className="font-bold text-amber-400">+{formatNumber(multiplierPts)}</div>
          </div>
          <div className="p-2 rounded bg-secondary/50 border border-border/40">
            <div className="text-[9px] text-muted-foreground uppercase">SPEED BONUS</div>
            <div className="font-bold text-primary">+{formatNumber(speedBonusPts)}</div>
          </div>
        </div>

        {/* Accuracy Penalty Banner */}
        <div className={`p-2 rounded border text-[10px] mb-2 flex items-center justify-between ${computedPenaltyPct > 0 ? "bg-rose-950/40 border-rose-500/40 text-rose-300" : "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"}`}>
          <span>
            {computedPenaltyPct > 0
              ? `⚠️ ACCURACY PENALTY: (2 × (100 - ${accuracyVal}%)) = -${computedPenaltyPct}% on Base Typing.`
              : `✨ FLAWLESS ACCURACY (100%): Zero deduction applied to Base Typing score.`}
          </span>
          <span className="font-bold">Net Typing: {formatNumber(finalNetTyping)} PTS</span>
        </div>

        {/* Expected & Pure Luck Variance */}
        <div className="grid grid-cols-2 gap-2 mb-2.5 text-xs">
          <div className="p-2 rounded bg-secondary/40 border border-border/40">
            <div className="text-[9px] text-muted-foreground uppercase">EXPECTED (EV)</div>
            <div className="font-bold text-muted-foreground">+{formatNumber(totalEV)} PTS</div>
          </div>
          <div className="p-2 rounded bg-secondary/40 border border-border/40">
            <div className="text-[9px] text-muted-foreground uppercase">LUCK (VARIANCE)</div>
            <div className={`font-bold ${luckScore >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {luckScore >= 0 ? `+${formatNumber(luckScore)}` : formatNumber(luckScore)} PTS
            </div>
          </div>
        </div>

        {/* Invariant Equation Ticker */}
        <div className="p-2 rounded bg-secondary/30 border border-border/40 text-[10px] text-muted-foreground flex items-center justify-between">
          <span>SUM CHECK:</span>
          <span className="font-bold text-foreground">
            {formatNumber(finalNetTyping)} + {formatNumber(multiplierPts)} + {formatNumber(speedBonusPts)} = {formatNumber(roundedScore)} PTS
          </span>
        </div>

        {/* Risk Distribution Tiers */}
        <div className="p-2 rounded bg-secondary/30 border border-border/40 text-[11px] flex flex-wrap items-center justify-between gap-1">
          <span className="text-muted-foreground text-[10px]">WORDS TYPED:</span>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold">🟢 Safe: {safeCount}</span>
            <span className="text-amber-400 font-bold">🟡 Caution: {cautionCount}</span>
            <span className="text-rose-400 font-bold">🔴 Danger: {dangerCount}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
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
          VIEW STATS
        </button>
      </div>
    </div>
  );
}
