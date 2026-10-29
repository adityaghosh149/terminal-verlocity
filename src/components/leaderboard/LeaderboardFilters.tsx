"use client";

import React from "react";

interface LeaderboardFiltersProps {
  modeFilter: string;
  setModeFilter: (mode: string) => void;
  difficultyFilter: string;
  setDifficultyFilter: (diff: string) => void;
  setPage: (page: number) => void;
}

export function LeaderboardFilters({
  modeFilter,
  setModeFilter,
  difficultyFilter,
  setDifficultyFilter,
  setPage,
}: LeaderboardFiltersProps) {
  const modes = [
    { id: "all", label: "All Modes" },
    { id: "classic", label: "Classic 90s" },
    { id: "endless", label: "Endless" },
    { id: "daily", label: "Daily Challenge" },
  ];

  const difficulties = [
    { id: "all", label: "All Difficulties" },
    { id: "easy", label: "Easy" },
    { id: "medium", label: "Medium" },
    { id: "hard", label: "Hard" },
  ];

  return (
    <div className="mb-6 p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
      {/* Game Mode Filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase mr-1">MODE:</span>
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setModeFilter(m.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              modeFilter === m.id
                ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm glow-primary"
                : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Difficulty Filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase mr-1">DIFFICULTY:</span>
        {difficulties.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              setDifficultyFilter(d.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              difficultyFilter === d.id
                ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm glow-primary"
                : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
