"use client";

import { useState } from "react";
import { PhaserGame } from "@/components/game/PhaserGame";
import { useGameStore } from "@/store/useGameStore";
import { Difficulty, GameMode, HudMode } from "@/types";
import { Terminal, Shield, Zap, Flame, Award, Sliders } from "lucide-react";

export default function GamePage() {
  const {
    difficulty,
    setDifficulty,
    mode,
    setMode,
    hudMode,
    setHudMode,
  } = useGameStore();

  const difficulties: { id: Difficulty; label: string; desc: string }[] = [
    { id: "easy", label: "EASY", desc: "Slower drop speed, 4-letter words, generous firewall" },
    { id: "medium", label: "MEDIUM", desc: "Standard speed, 6-letter cipher hashes, balanced EV" },
    { id: "hard", label: "HARD", desc: "Rapid fall velocity, 9+ byte strings, demanding risk" },
  ];

  const modes: { id: GameMode; label: string; desc: string }[] = [
    { id: "classic", label: "CLASSIC", desc: "90-second timed sprint for highest validated score" },
    { id: "endless", label: "ENDLESS", desc: "Survival mode: withstand continuous streams until 3 shields drop" },
    { id: "daily", label: "DAILY CHALLENGE", desc: "Deterministic seed: identical packet sequence for all players globally" },
  ];

  const hudModes: { id: HudMode; label: string }[] = [
    { id: "minimal", label: "Minimal (Reward & Risk)" },
    { id: "standard", label: "Standard (+ Badges)" },
    { id: "analytical", label: "Analytical (+ EV & VPS)" },
  ];

  return (
    <div className="container max-w-6xl px-4 py-8 flex flex-col items-center">
      {/* Controls & Configuration Bar */}
      <div className="w-full max-w-5xl mb-6 p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            MODE:
          </span>
          <div className="flex rounded-lg bg-secondary/80 p-0.5 border border-border">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                  mode === m.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={m.desc}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-amber-400" />
            DIFFICULTY:
          </span>
          <div className="flex rounded-lg bg-secondary/80 p-0.5 border border-border">
            {difficulties.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                  difficulty === d.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={d.desc}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* HUD Mode */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-primary" />
            HUD:
          </span>
          <select
            value={hudMode}
            onChange={(e) => setHudMode(e.target.value as HudMode)}
            className="text-xs bg-secondary/80 border border-border text-foreground rounded-md px-2 py-1 cursor-pointer font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {hudModes.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Arcade Playfield Component */}
      <PhaserGame
        key={`${mode}-${difficulty}`}
        mode={mode}
        difficulty={difficulty}
      />
    </div>
  );
}
