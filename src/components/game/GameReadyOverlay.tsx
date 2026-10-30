"use client";

import React from "react";
import { Zap, LogIn, Code, ShieldCheck, Terminal, Cpu } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSessionStore } from "@/store/useSessionStore";
import { WordPackType } from "@/types";

interface GameReadyOverlayProps {
  mode: string;
  difficulty: string;
  wordPack?: WordPackType;
  onSelectWordPack?: (pack: WordPackType) => void;
  onStart: () => void;
}

export function GameReadyOverlay({
  mode,
  difficulty,
  wordPack = "core",
  onSelectWordPack,
  onStart,
}: GameReadyOverlayProps) {
  const { user, openAuthModal } = useAuthStore();
  const { username } = useSessionStore();

  const activeName = user?.username || username;

  const handleStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (!activeName) {
      openAuthModal("login");
      return;
    }
    onStart();
  };

  const PACKS: Array<{ id: WordPackType; label: string; icon: any }> = [
    { id: "core", label: "Core Cyber", icon: Cpu },
    { id: "developer", label: "Dev Syntax", icon: Code },
    { id: "cybersecurity", label: "Security", icon: ShieldCheck },
    { id: "sysadmin", label: "Linux Admin", icon: Terminal },
  ];

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

      {/* Word Pack Selection */}
      <div className="mt-4 flex flex-col items-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 font-bold">
          SELECT THEMED WORD PACK:
        </span>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {PACKS.map((p) => {
            const Icon = p.icon;
            const isSelected = wordPack === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectWordPack && onSelectWordPack(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground border border-primary shadow-sm glow-primary"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground border border-border/60 hover:bg-secondary"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Username / Account Status */}
      <div className="mt-4 flex items-center justify-center gap-2 font-mono">
        <span className="text-[11px] text-muted-foreground uppercase">PLAYER:</span>
        {activeName ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary/10 border border-primary/30 text-xs font-mono font-bold text-primary shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            @{activeName}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary border border-primary/40 text-xs font-mono font-bold text-primary hover:bg-primary/10 transition-all glow-primary"
          >
            <LogIn className="h-3 w-3" />
            LOG IN / REGISTER
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
        Type the falling words before they hit the bottom. You have{" "}
        <span className="text-primary font-bold">5 Shields</span>. Catch 🛡️ Nanite packets to restore shields!
      </p>

      <div className="mt-5 flex items-center justify-center">
        <button
          onClick={handleStart}
          className="bg-primary text-primary-foreground font-display font-black px-8 py-3.5 rounded-lg text-sm hover:opacity-90 transition-all glow-primary tracking-widest"
        >
          {activeName ? "START PLAYING [SPACE]" : "LOG IN / REGISTER & START"}
        </button>
      </div>
    </div>
  );
}
