"use client";

import React from "react";
import { PacketDefinition } from "@/types";
import { LANES } from "./types";

interface PacketCardProps {
  packet: PacketDefinition;
  isTarget: boolean;
  currentInput: string;
  totalDuration: number;
  onClick: () => void;
}

export function PacketCard({
  packet,
  isTarget,
  currentInput,
  totalDuration,
  onClick,
}: PacketCardProps) {
  const progress = Math.max(0, Math.min(1, 1 - packet.durationSeconds / totalDuration));
  const topY = progress * 460 + 15; // 15px to 475px
  const lanePercent = LANES[packet.laneIndex % 4];

  // Standardized Risk Tiers
  const isSafe = packet.corruptionProbability < 0.25;
  const isCaution = packet.corruptionProbability >= 0.25 && packet.corruptionProbability < 0.50;
  const isDanger = packet.corruptionProbability >= 0.50;

  // Prefix matching indicator for candidate words
  const isPrefixMatch =
    !isTarget && currentInput.length > 0 && packet.code.startsWith(currentInput);

  return (
    <div
      onClick={onClick}
      style={{
        top: `${topY}px`,
        left: `${lanePercent}%`,
        transform: "translateX(-50%)",
      }}
      className={`absolute w-48 sm:w-52 rounded-xl border p-2.5 backdrop-blur-md cursor-pointer select-none will-change-transform transition-[border-color,box-shadow] duration-150 ${
        isTarget
          ? "border-primary bg-primary/20 ring-2 ring-primary scale-105 z-20 glow-primary shadow-2xl"
          : isSafe
          ? "border-emerald-500/50 bg-card/90 hover:border-emerald-400 z-10 shadow-lg"
          : isCaution
          ? "border-amber-500/50 bg-card/90 hover:border-amber-400 z-10 shadow-lg"
          : "border-rose-500/50 bg-card/90 hover:border-rose-400 z-10 shadow-lg"
      }`}
    >
      {/* Header: Reward & Risk Tag */}
      <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
        <span className="font-bold text-foreground font-display text-xs">
          +{packet.reward} PTS
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            isSafe
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              : isCaution
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
          }`}
        >
          {isSafe ? "🟢 SAFE" : isCaution ? "🟡 CAUTION" : "🔴 DANGER (-1 🛡️)"}
        </span>
      </div>

      {/* Word String to Type */}
      <div className="text-center font-mono text-lg font-black tracking-widest my-1.5 py-1 rounded bg-black/60 border border-border/40">
        {isTarget ? (
          <span>
            <span className="text-primary glow-text font-black">
              {packet.code.slice(0, currentInput.length)}
            </span>
            <span className="text-foreground">
              {packet.code.slice(currentInput.length)}
            </span>
          </span>
        ) : isPrefixMatch ? (
          <span>
            <span className="text-amber-400 font-bold">
              {packet.code.slice(0, currentInput.length)}
            </span>
            <span className="text-foreground">
              {packet.code.slice(currentInput.length)}
            </span>
          </span>
        ) : (
          <span className="text-foreground">{packet.code}</span>
        )}
      </div>

      {/* Countdown Progress & Timer */}
      <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-muted-foreground">
        <span>TIME:</span>
        <span className="font-bold">{Math.max(0, packet.durationSeconds).toFixed(1)}s</span>
      </div>

      <div className="w-full bg-secondary/80 h-1 rounded-full overflow-hidden mt-1">
        <div
          className={`h-full ${
            isTarget
              ? "bg-primary"
              : isSafe
              ? "bg-emerald-400"
              : isCaution
              ? "bg-amber-400"
              : "bg-rose-400"
          }`}
          style={{ width: `${(packet.durationSeconds / totalDuration) * 100}%` }}
        />
      </div>
    </div>
  );
}
