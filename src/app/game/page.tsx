"use client";

import { useState } from "react";
import { PhaserGame } from "@/components/game/PhaserGame";
import { useGameStore } from "@/store/useGameStore";
import { Difficulty, GameMode } from "@/types";
import { Shield, Zap, Info, RotateCcw } from "lucide-react";
import { HowToPlayModal } from "@/components/game/HowToPlayModal";

export default function GamePage() {
  const [restartKey, setRestartKey] = useState(0);
  const {
    difficulty,
    setDifficulty,
    mode,
    setMode,
  } = useGameStore();

  const difficulties: { id: Difficulty; label: string; desc: string }[] = [
    { id: "easy", label: "EASY", desc: "4-letter words, slower velocity, generous firewall" },
    { id: "medium", label: "MEDIUM", desc: "6-letter ciphers, balanced risk & reward" },
    { id: "hard", label: "HARD", desc: "8+ character strings, rapid fall velocity, high reward" },
  ];

  const modes: { id: GameMode; label: string; desc: string }[] = [
    { id: "classic", label: "CLASSIC (90s)", desc: "90-second timed sprint for highest validated score" },
    { id: "endless", label: "SURVIVAL", desc: "Survive continuous waves until 3 shields drop" },
    { id: "daily", label: "DAILY CHALLENGE", desc: "Global synchronized seed: identical packets for all players" },
  ];

  return (
    <div className="container max-w-6xl px-4 py-8 flex flex-col items-center font-sans">
      {/* Controls & Configuration Bar */}
      <div className="w-full max-w-5xl mb-6 p-4 rounded-xl border border-border/80 bg-card/75 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
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
                type="button"
                onClick={() => setMode(m.id)}
                className={`px-3 py-1 rounded-md text-xs font-display font-bold transition-all ${
                  mode === m.id
                    ? "bg-primary text-primary-foreground shadow-sm glow-primary"
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
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={`px-3 py-1 rounded-md text-xs font-display font-bold transition-all ${
                  difficulty === d.id
                    ? "bg-primary text-primary-foreground shadow-sm glow-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={d.desc}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions: Restart & How to Play */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setRestartKey((prev) => prev + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 border border-border hover:border-primary/50 text-xs font-display font-bold text-muted-foreground hover:text-foreground transition-all hover:bg-secondary active:scale-95 shadow-sm"
            title="Restart Game"
          >
            <RotateCcw className="h-3.5 w-3.5 text-primary" />
            RESTART
          </button>
          <HowToPlayModal />
        </div>
      </div>

      {/* Arcade Playfield Component */}
      <PhaserGame
        key={`${mode}-${difficulty}-${restartKey}`}
        mode={mode}
        difficulty={difficulty}
      />

      {/* Strategic Directive Box Under Arcade */}
      <div className="w-full max-w-5xl mt-6 p-4 rounded-xl border border-border/60 bg-secondary/20 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong className="text-foreground">QUICK RULES:</strong> Type words before they hit the bottom line. Each expired packet costs <strong>1 Shield</strong>. Choose 🟢 <strong>Safe</strong> for reliable points or 🔴 <strong>Danger</strong> for huge risk-reward payouts!
          </span>
        </div>
      </div>
    </div>
  );
}
