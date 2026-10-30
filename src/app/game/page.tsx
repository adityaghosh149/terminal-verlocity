"use client";

import { useState } from "react";
import Link from "next/link";
import { PhaserGame } from "@/components/game/PhaserGame";
import { useGameStore } from "@/store/useGameStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Difficulty, GameMode } from "@/types";
import { Shield, Zap, Info, RotateCcw, Lock, Trophy, UserPlus, LogIn } from "lucide-react";
import { HowToPlayModal } from "@/components/game/HowToPlayModal";

export default function GamePage() {
  const [restartKey, setRestartKey] = useState(0);
  const { difficulty, setDifficulty, mode, setMode } = useGameStore();
  const { user, isLoading, openAuthModal } = useAuthStore();

  const difficulties: { id: Difficulty; label: string; desc: string }[] = [
    { id: "easy", label: "EASY", desc: "4-letter words, smooth entry velocity, 5 shields" },
    { id: "medium", label: "MEDIUM", desc: "5-letter words, balanced typing speed and risk" },
    { id: "hard", label: "HARD", desc: "6-letter words, rapid fall velocity, high reward" },
  ];

  const modes: { id: GameMode; label: string; desc: string }[] = [
    { id: "classic", label: "CLASSIC (90s)", desc: "90-second timed sprint for highest validated score" },
    { id: "endless", label: "SURVIVAL", desc: "Survive continuous waves until 5 shields drop" },
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
            disabled={!user}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 border border-border hover:border-primary/50 text-xs font-display font-bold text-muted-foreground hover:text-foreground transition-all hover:bg-secondary active:scale-95 shadow-sm disabled:opacity-40"
            title="Restart Game"
          >
            <RotateCcw className="h-3.5 w-3.5 text-primary" />
            RESTART
          </button>
          <HowToPlayModal />
        </div>
      </div>

      {/* Main Arcade Playfield or Login Barrier */}
      {user ? (
        <PhaserGame
          key={`${mode}-${difficulty}-${restartKey}`}
          mode={mode}
          difficulty={difficulty}
        />
      ) : (
        <div className="relative w-full max-w-5xl h-[600px] rounded-2xl border border-primary/30 bg-card/90 backdrop-blur-md overflow-hidden shadow-2xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 mb-4 glow-primary">
            <Lock className="h-8 w-8 text-primary" />
          </div>

          <h2 className="text-3xl font-black font-display tracking-tight text-foreground">
            LOGIN REQUIRED TO PLAY
          </h2>
          <p className="mt-2 text-xs font-mono text-muted-foreground max-w-md mx-auto uppercase tracking-wider">
            You must be logged in to intercept data streams, earn multiplier streaks, and post scores to the global leaderboard.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
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

          <div className="mt-8 pt-6 border-t border-border/40 w-full max-w-sm flex items-center justify-center">
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              Browse Public Leaderboard (Open to all visitors) &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Strategic Directive Box Under Arcade */}
      <div className="w-full max-w-5xl mt-6 p-4 rounded-xl border border-border/60 bg-secondary/20 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong className="text-foreground">RULES:</strong> Type words before they hit the bottom line. Each expired packet costs <strong>1 Shield</strong>. Choose 🟢 <strong>Safe</strong> for reliable points or 🔴 <strong>Danger</strong> for huge payouts!
          </span>
        </div>
      </div>
    </div>
  );
}
