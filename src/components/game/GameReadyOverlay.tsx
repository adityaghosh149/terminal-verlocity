"use client";

import React from "react";
import { Zap, User } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

interface GameReadyOverlayProps {
  mode: string;
  difficulty: string;
  onStart: () => void;
}

export function GameReadyOverlay({ mode, difficulty, onStart }: GameReadyOverlayProps) {
  const { username, openCallsignModal } = useSessionStore();

  const handleStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (!username) {
      openCallsignModal();
      return;
    }
    onStart();
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md z-40 p-6 text-center animate-in fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 mb-4 glow-primary">
        <Zap className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-foreground">
        DATA STREAM READY
      </h2>
      <p className="mt-2 text-xs font-mono text-muted-foreground uppercase tracking-widest">
        MODE: <span className="text-primary font-bold">{mode}</span> // DIFFICULTY:{" "}
        <span className="text-amber-400 font-bold">{difficulty}</span>
      </p>

      {/* Username Badge */}
      <div className="mt-4 flex items-center justify-center gap-2 font-mono">
        <span className="text-[11px] text-muted-foreground uppercase">USERNAME:</span>
        {username ? (
          <button
            type="button"
            onClick={openCallsignModal}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary/10 border border-primary/30 text-xs font-mono font-bold text-primary hover:bg-primary/20 transition-all"
            title="Change username"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            @{username}
            <span className="text-[10px] text-muted-foreground font-normal">(change)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={openCallsignModal}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary border border-primary/40 text-xs font-mono font-bold text-primary hover:bg-primary/10 transition-all glow-primary"
          >
            <User className="h-3 w-3" />
            SET USERNAME
          </button>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
        Type the falling words before they hit the bottom. You have <span className="text-primary font-bold">5 Shields</span>. Missed words cost 1 Shield.
      </p>

      <div className="mt-6 flex items-center justify-center">
        <button
          onClick={handleStart}
          className="bg-primary text-primary-foreground font-display font-black px-8 py-3.5 rounded-lg text-sm hover:opacity-90 transition-all glow-primary tracking-widest"
        >
          {username ? "START PLAYING [SPACE]" : "SET USERNAME & START"}
        </button>
      </div>
    </div>
  );
}
