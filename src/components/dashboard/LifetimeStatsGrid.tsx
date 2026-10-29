"use client";

import React from "react";
import { Award, Zap, Shield, Activity } from "lucide-react";
import { UserProfile } from "@/types";

interface LifetimeStatsGridProps {
  playerStats: any;
  user: UserProfile | null;
}

export function LifetimeStatsGrid({ playerStats, user }: LifetimeStatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 font-mono">
      <div className="p-4 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md">
        <div className="text-[11px] text-muted-foreground uppercase flex items-center gap-1.5">
          <Award className="h-4 w-4 text-amber-400" />
          LIFETIME SCORE
        </div>
        <div className="text-2xl font-black text-foreground mt-1">
          {playerStats?.user?.lifetimeScore?.toLocaleString() ||
            (user ? user.lifetimeScore.toLocaleString() : "0")}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Best Run:{" "}
          {playerStats?.user?.bestScore?.toLocaleString() ||
            (user ? user.bestScore.toLocaleString() : "0")}{" "}
          PTS
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md">
        <div className="text-[11px] text-muted-foreground uppercase flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-primary" />
          TYPING VELOCITY
        </div>
        <div className="text-2xl font-black text-primary glow-text mt-1">
          {playerStats?.user?.bestWpm || (user ? user.bestWpm : 0)} WPM
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Avg Accuracy: {playerStats?.user?.avgAccuracy || (user ? user.avgAccuracy : 100)}%
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md">
        <div className="text-[11px] text-muted-foreground uppercase flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-emerald-400" />
          CLEAN INTERCEPTIONS
        </div>
        <div className="text-2xl font-black text-emerald-400 mt-1">
          {playerStats?.user?.packetsClean?.toLocaleString() ||
            (user ? user.packetsClean.toLocaleString() : "0")}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Corrupted: {playerStats?.user?.packetsCorrupted || (user ? user.packetsCorrupted : 0)}
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md">
        <div className="text-[11px] text-muted-foreground uppercase flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-purple-400" />
          GAMES DEPLOYED
        </div>
        <div className="text-2xl font-black text-purple-400 mt-1">
          {playerStats?.user?.gamesPlayed || (user ? user.gamesPlayed : 0)}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Operative Level {playerStats?.user?.level || (user ? user.level : 1)}
        </div>
      </div>
    </div>
  );
}
