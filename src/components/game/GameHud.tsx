"use client";

import React from "react";
import {
  Shield,
  Clock,
  Zap,
  Flame,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Pause,
  Play,
  Maximize,
  Minimize,
} from "lucide-react";
import { getComboMultiplier } from "./types";
import { formatNumber } from "@/lib/utils";

interface GameHudProps {
  score: number;
  combo: number;
  lives: number;
  mode: "classic" | "endless" | "daily";
  difficulty: "easy" | "medium" | "hard";
  timeRemaining: number;
  elapsedSeconds: number;
  soundEnabled: boolean;
  isPaused: boolean;
  isFullscreen?: boolean;
  onRestart: () => void;
  onToggleSound: () => void;
  onTogglePause: () => void;
  onToggleFullscreen?: () => void;
}

export function GameHud({
  score,
  combo,
  lives,
  mode,
  difficulty,
  timeRemaining,
  elapsedSeconds,
  soundEnabled,
  isPaused,
  isFullscreen,
  onRestart,
  onToggleSound,
  onTogglePause,
  onToggleFullscreen,
}: GameHudProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border/80 bg-secondary/50 backdrop-blur-md z-20">
      <div className="flex items-center gap-5 sm:gap-6">
        {/* Score */}
        <div>
          <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
            SCORE
          </div>
          <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-primary glow-text">
            {formatNumber(score)}
          </div>
        </div>

        {/* Clean Streak Combo */}
        <div className="hidden sm:block">
          <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
            COMBO
          </div>
          <div className="text-xl sm:text-2xl font-black font-display text-amber-400 flex items-center gap-1">
            <Flame
              className={`h-5 w-5 ${
                combo >= 3 ? "text-amber-400 fill-amber-400/40" : "text-muted-foreground"
              }`}
            />
            {getComboMultiplier(combo)}x
            {combo > 0 && (
              <span className="text-xs font-mono text-muted-foreground ml-1 font-normal">
                ({combo})
              </span>
            )}
          </div>
        </div>

        {/* 5 Shields */}
        <div>
          <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
            SHIELDS ({lives}/5)
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {[1, 2, 3, 4, 5].map((idx) => (
              <Shield
                key={idx}
                className={`h-4 sm:h-5 w-4 sm:w-5 transition-all ${
                  idx <= lives
                    ? "text-primary fill-primary/30 drop-shadow-[0_0_8px_currentColor]"
                    : "text-muted-foreground/25 fill-transparent"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Center: Mode Badge */}
      <div className="hidden lg:flex items-center gap-2 font-mono text-xs">
        {mode === "classic" && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-bold">
            <Zap className="h-3.5 w-3.5" />
            <span>CLASSIC (90s)</span>
            <span className="text-muted-foreground">//</span>
            <span className="text-amber-400">{difficulty.toUpperCase()}</span>
          </div>
        )}
        {mode === "endless" && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
            <Shield className="h-3.5 w-3.5" />
            <span>SURVIVAL</span>
            <span className="text-muted-foreground">//</span>
            <span className="text-amber-400">{difficulty.toUpperCase()}</span>
          </div>
        )}
        {mode === "daily" && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>DAILY</span>
            <span className="text-muted-foreground">//</span>
            <span className="text-primary">{difficulty.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Right side: Timer, Pause, Restart, Sound */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase text-right">
            {mode === "classic" ? "TIME" : "ELAPSED"}
          </div>
          <div
            className={`text-xl sm:text-2xl font-black font-display flex items-center justify-end gap-1 ${
              mode === "classic" && timeRemaining <= 10
                ? "text-rose-500 animate-pulse glow-danger"
                : mode === "classic" && timeRemaining <= 20
                ? "text-amber-400"
                : "text-foreground"
            }`}
          >
            <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
            {mode === "classic"
              ? `${timeRemaining}s`
              : `${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60)
                  .toString()
                  .padStart(2, "0")}`}
          </div>
        </div>

        {/* Pause Button */}
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onTogglePause();
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
            isPaused
              ? "bg-amber-400 text-black border-amber-400 shadow-md"
              : "bg-secondary/80 border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
          }`}
          title="Pause Game [ESC]"
        >
          {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{isPaused ? "RESUME" : "PAUSE"}</span>
        </button>

        {/* Restart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onRestart();
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary/80 border border-border hover:border-primary/50 text-xs font-mono font-bold text-muted-foreground hover:text-foreground transition-all active:scale-95 shadow-sm"
          title="Restart Game [Ctrl+Enter]"
        >
          <RotateCcw className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">RESTART</span>
        </button>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          className="p-1.5 rounded-lg bg-secondary/80 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors"
          title="Toggle Sound"
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4 text-primary" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg bg-secondary/80 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen [F]"}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4 text-primary" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
