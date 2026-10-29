"use client";

import React from "react";
import { Zap } from "lucide-react";

interface GameReadyOverlayProps {
  mode: string;
  difficulty: string;
  onStart: () => void;
}

export function GameReadyOverlay({ mode, difficulty, onStart }: GameReadyOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md z-40 p-6 text-center animate-in fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 mb-4 glow-primary">
        <Zap className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-foreground">
        DATA STREAM ONLINE
      </h2>
      <p className="mt-2 text-xs font-mono text-muted-foreground uppercase tracking-widest">
        MODE: <span className="text-primary font-bold">{mode}</span> // DIFFICULTY:{" "}
        <span className="text-amber-400 font-bold">{difficulty}</span>
      </p>
      <p className="mt-3 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
        Words descend across 4 telemetry lanes. Type the first letter on your keyboard to lock
        target. Keep your 3 Shields intact: words that reach the bottom firewall line will disappear
        and cost a shield!
      </p>

      <div className="mt-8 flex items-center justify-center">
        <button
          onClick={(e) => {
            e.currentTarget.blur();
            onStart();
          }}
          className="bg-primary text-primary-foreground font-display font-black px-8 py-3.5 rounded-lg text-sm hover:opacity-90 transition-all glow-primary tracking-widest"
        >
          START INTERCEPTION [SPACE]
        </button>
      </div>
    </div>
  );
}
