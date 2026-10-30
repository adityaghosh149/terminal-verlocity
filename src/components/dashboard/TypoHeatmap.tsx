"use client";

import React, { useState } from "react";
import { Keyboard, AlertCircle, CheckCircle2 } from "lucide-react";

interface TypoHeatmapProps {
  typoMap?: Record<string, number>;
  totalKeystrokes?: number;
}

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export function TypoHeatmap({ typoMap = {}, totalKeystrokes = 0 }: TypoHeatmapProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Compute maximum typos on any single key to calculate relative heat (0 to 1)
  const maxTypos = Math.max(1, ...Object.values(typoMap));
  const totalTypos = Object.values(typoMap).reduce((a, b) => a + b, 0);

  const getKeyColor = (char: string) => {
    const count = typoMap[char] || 0;
    if (count === 0) {
      return "bg-secondary/40 text-foreground border-border/60 hover:border-primary/50";
    }
    const ratio = count / maxTypos;
    if (ratio < 0.25) {
      return "bg-amber-950/40 text-amber-300 border-amber-500/50 hover:border-amber-400";
    }
    if (ratio < 0.6) {
      return "bg-orange-950/60 text-orange-300 border-orange-500/70 hover:border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]";
    }
    return "bg-rose-950/80 text-rose-300 border-rose-500 hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)] glow-danger animate-pulse";
  };

  return (
    <div className="p-5 rounded-2xl bg-card/95 border border-border/80 backdrop-blur-md shadow-xl font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary glow-primary">
            <Keyboard className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground text-sm uppercase tracking-wide flex items-center gap-2">
              INTERACTIVE QWERTY TYPO HEATMAP
            </h3>
            <p className="text-[11px] font-mono text-muted-foreground">
              Visual telemetry of keystroke error distribution across keyboard zones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary/50 border border-border text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
            <span>Total Errors: <strong className="text-foreground">{totalTypos}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary/50 border border-border text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Clean Keys: <strong className="text-emerald-400">
              {26 - Object.keys(typoMap).filter((k) => typoMap[k] > 0).length}/26
            </strong></span>
          </div>
        </div>
      </div>

      {/* Virtual Keyboard Grid */}
      <div className="p-4 rounded-xl bg-black/60 border border-border/60 flex flex-col items-center gap-2 select-none">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div
            key={rIdx}
            className="flex items-center justify-center gap-1.5 w-full"
            style={{
              paddingLeft: rIdx === 1 ? "14px" : rIdx === 2 ? "28px" : "0px",
            }}
          >
            {row.map((char) => {
              const count = typoMap[char] || 0;
              const isSelected = selectedKey === char;
              return (
                <button
                  key={char}
                  type="button"
                  onClick={() => setSelectedKey(isSelected ? null : char)}
                  className={`relative flex flex-col items-center justify-center h-10 w-8 sm:w-10 rounded-lg border font-mono font-bold text-xs transition-all duration-150 ${getKeyColor(
                    char
                  )} ${isSelected ? "ring-2 ring-primary scale-110 z-10" : ""}`}
                >
                  <span>{char}</span>
                  {count > 0 && (
                    <span className="text-[9px] font-black opacity-80 -mt-0.5">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Selected Key Details or Legend */}
      <div className="mt-3.5 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-muted-foreground gap-2 pt-2 border-t border-border/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-secondary/60 border border-border" />
            <span>0 Errors (Clean)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-amber-500/80" />
            <span>Low (1–2)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-orange-500/90" />
            <span>Medium (3–5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-rose-500 animate-pulse" />
            <span>Hotspot (6+)</span>
          </div>
        </div>

        {selectedKey ? (
          <div className="text-primary font-bold">
            Key [{selectedKey}]: {typoMap[selectedKey] || 0} mistypes logged
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground/80 italic">
            Click any key to inspect individual mistype counts
          </div>
        )}
      </div>
    </div>
  );
}
