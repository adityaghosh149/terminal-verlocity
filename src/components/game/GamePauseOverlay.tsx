"use client";

import React from "react";
import { Play, RotateCcw, Pause } from "lucide-react";

interface GamePauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
}

export function GamePauseOverlay({ onResume, onRestart }: GamePauseOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md z-40 p-6 text-center animate-in fade-in duration-150">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 mb-3 glow-primary">
        <Pause className="h-7 w-7 text-primary" />
      </div>

      <h2 className="text-3xl font-black font-display tracking-tight text-foreground">
        GAME PAUSED
      </h2>
      <p className="mt-1 text-xs font-mono text-muted-foreground uppercase tracking-widest">
        Terminal flow suspended
      </p>

      {/* Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        <button
          onClick={onResume}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display font-bold px-6 py-3 rounded-lg text-xs hover:opacity-90 transition-all glow-primary tracking-wider"
        >
          <Play className="h-4 w-4" />
          RESUME [ESC]
        </button>

        <button
          onClick={onRestart}
          className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-display font-bold px-6 py-3 rounded-lg text-xs border border-border transition-all tracking-wider"
        >
          <RotateCcw className="h-4 w-4 text-primary" />
          RESTART [R]
        </button>
      </div>

      <div className="mt-6 text-[11px] font-mono text-muted-foreground">
        Press <span className="text-primary font-bold">[ESC]</span> to resume or{" "}
        <span className="text-amber-400 font-bold">[R]</span> to restart.
      </div>
    </div>
  );
}
