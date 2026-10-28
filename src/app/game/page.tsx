"use client";

import { useState } from "react";
import { PhaserGame } from "@/components/game/PhaserGame";
import { useGameStore } from "@/store/useGameStore";
import { Difficulty, GameMode, HudMode } from "@/types";
import { Terminal, Shield, Zap, Flame, Award, Sliders, HelpCircle, Info } from "lucide-react";
import { HowToPlayModal } from "@/components/game/HowToPlayModal";

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
    { id: "easy", label: "EASY", desc: "4-letter words, slower velocity, generous firewall" },
    { id: "medium", label: "MEDIUM", desc: "6-letter ciphers, balanced risk & reward" },
    { id: "hard", label: "HARD", desc: "9+ character strings, rapid fall velocity, severe penalties" },
  ];

  const modes: { id: GameMode; label: string; desc: string }[] = [
    { id: "classic", label: "CLASSIC (90s)", desc: "90-second timed sprint for highest validated score" },
    { id: "endless", label: "ENDLESS", desc: "Survival mode: withstand continuous streams until 3 shields drop" },
    { id: "daily", label: "DAILY CHALLENGE", desc: "Deterministic seed: identical packet sequence for all players globally" },
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
                className={`px-3 py-1 rounded-md text-xs font-display font-bold transition-all ${
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
                className={`px-3 py-1 rounded-md text-xs font-display font-bold transition-all ${
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

        {/* How to Play Guide Modal Button */}
        <div className="flex items-center gap-3">
          <HowToPlayModal />
        </div>
      </div>

      {/* Arcade Playfield Component */}
      <PhaserGame
        key={`${mode}-${difficulty}`}
        mode={mode}
        difficulty={difficulty}
      />

      {/* Strategic Rule Box Under Arcade */}
      <div className="w-full max-w-5xl mt-6 p-4 rounded-xl border border-border/60 bg-secondary/20 flex items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong className="text-foreground">TACTICAL DIRECTIVE:</strong> Packets with negative EV are traps. Prioritize high-reward low-risk payloads (+EV) to build your combo multiplier without breaking shields.
          </span>
        </div>
      </div>
    </div>
  );
}
