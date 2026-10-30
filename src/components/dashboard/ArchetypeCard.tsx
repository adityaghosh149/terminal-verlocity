"use client";

import React from "react";
import { Shield, Zap, Dices, Award, Sparkles } from "lucide-react";

interface ArchetypeCardProps {
  wpm?: number;
  accuracy?: number;
  dangerRatio?: number;
  missedCount?: number;
  rationalIndex?: number;
}

export function ArchetypeCard({
  wpm = 60,
  accuracy = 95,
  dangerRatio = 0.15,
  missedCount = 0,
  rationalIndex = 85,
}: ArchetypeCardProps) {
  // Classification logic based on player choices and physical telemetry
  let archetype: {
    title: string;
    badge: string;
    icon: typeof Shield;
    color: string;
    border: string;
    bg: string;
    glow: string;
    description: string;
    trait1: string;
    trait2: string;
  };

  if (accuracy >= 98 && missedCount === 0) {
    archetype = {
      title: "The Zen Master",
      badge: "🧘 FLAWLESS EXECUTION",
      icon: Sparkles,
      color: "text-emerald-400",
      border: "border-emerald-500/50",
      bg: "bg-emerald-950/30",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
      description:
        "Near-zero keystroke errors and immaculate firewall defense. You never let a word slip past your defenses and treat typing as an art of precision.",
      trait1: "98%+ Keystroke Accuracy",
      trait2: "0 Missed Packets",
    };
  } else if (dangerRatio >= 0.25) {
    archetype = {
      title: "The High Roller",
      badge: "🎲 ADRENALINE GAMBLER",
      icon: Dices,
      color: "text-rose-400",
      border: "border-rose-500/50",
      bg: "bg-rose-950/30",
      glow: "shadow-[0_0_20px_rgba(244,63,94,0.3)]",
      description:
        "You fearlessly intercept 🔴 Danger and Golden High Roller packets for maximum point payouts, daring the probability engine to test your shields.",
      trait1: "High Danger Interception Rate",
      trait2: "Maximum Point Upside",
    };
  } else if (wpm >= 75) {
    archetype = {
      title: "The Speed Demon",
      badge: "⚡ VELOCITY OVERDRIVE",
      icon: Zap,
      color: "text-amber-400",
      border: "border-amber-500/50",
      bg: "bg-amber-950/30",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
      description:
        "Your fingers move with blistering mechanical velocity. You maximize speed bonuses (+50% to +100%) and clear vertical lanes before words even gain momentum.",
      trait1: "75+ Average WPM Velocity",
      trait2: "Heavy Speed Bonus Stacking",
    };
  } else {
    archetype = {
      title: "The Calculated Strategist",
      badge: "🛡️ MATHEMATICAL TACTICIAN",
      icon: Shield,
      color: "text-cyan-400",
      border: "border-cyan-500/50",
      bg: "bg-cyan-950/30",
      glow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]",
      description:
        "You analyze Expected Value ($EV$) before committing fingers to keys. You favor guaranteed positive-yield packets and preserve shields with calculated discipline.",
      trait1: "High Rational Decision Index",
      trait2: "Safe & Caution Preference",
    };
  }

  const IconComponent = archetype.icon;

  return (
    <div
      className={`p-5 rounded-2xl border ${archetype.border} ${archetype.bg} backdrop-blur-md ${archetype.glow} transition-all duration-200 font-sans shadow-xl`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl ${archetype.bg} border ${archetype.border} flex items-center justify-center ${archetype.color} shadow-lg`}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-muted-foreground block">
              PLAYER RISK ARCHETYPE
            </span>
            <h3 className={`text-xl font-black font-display tracking-tight ${archetype.color}`}>
              {archetype.title}
            </h3>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${archetype.border} ${archetype.color} bg-black/50`}
        >
          {archetype.badge}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        {archetype.description}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-black/40 border border-border/60 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-muted-foreground">Primary Driver:</span>
          <strong className="text-foreground ml-auto">{archetype.trait1}</strong>
        </div>
        <div className="p-2.5 rounded-lg bg-black/40 border border-border/60 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-muted-foreground">Core Strategy:</span>
          <strong className="text-foreground ml-auto">{archetype.trait2}</strong>
        </div>
      </div>
    </div>
  );
}
