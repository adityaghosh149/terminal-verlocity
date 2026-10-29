"use client";

import React from "react";
import { Palette, Sliders, Check } from "lucide-react";
import { Theme, HudMode } from "@/types";

interface ThemeSectionProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  hudMode: HudMode;
  setHudMode: (hudMode: HudMode) => void;
}

export function ThemeSection({ theme, setTheme, hudMode, setHudMode }: ThemeSectionProps) {
  const themes: { id: Theme; label: string; desc: string; color: string }[] = [
    { id: "midnight", label: "Midnight", desc: "Dark navy and electric cyan", color: "#00f0ff" },
    { id: "cyberpunk", label: "Cyberpunk", desc: "Deep purple and neon magenta", color: "#ff007f" },
    {
      id: "terminal",
      label: "Terminal Green",
      desc: "Classic phosphor green on black",
      color: "#00ff66",
    },
    { id: "amber", label: "Amber Protocol", desc: "Warm charcoal and amber glow", color: "#ffb703" },
    {
      id: "light",
      label: "Light Mode",
      desc: "Clean modern surfaces with high contrast",
      color: "#0284c7",
    },
  ];

  const hudModes: { id: HudMode; label: string; desc: string }[] = [
    { id: "minimal", label: "Minimal", desc: "Reward value and corruption probability" },
    { id: "standard", label: "Standard", desc: "Reward, risk rate, and visual risk indicators" },
    { id: "analytical", label: "Analytical", desc: "Full telemetry: Expected Value (EV) & Net VPS" },
  ];

  return (
    <>
      {/* Visual Theme Section */}
      <section className="p-6 rounded-xl border border-border/80 bg-card/75 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2 text-sm font-bold font-display text-foreground mb-4">
          <Palette className="h-4 w-4 text-primary" />
          Theme & Interface Style
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`p-3.5 rounded-lg border text-left transition-all ${
                theme === t.id
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-sm"
                  : "border-border/60 bg-secondary/40 text-foreground hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-display font-bold text-xs uppercase">
                  <span
                    className="h-2.5 w-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.label}
                </div>
                {theme === t.id && <Check className="h-4 w-4 text-primary" />}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{t.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Telemetry & HUD Mode */}
      <section className="p-6 rounded-xl border border-border/80 bg-card/75 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2 text-sm font-bold font-display text-foreground mb-4">
          <Sliders className="h-4 w-4 text-primary" />
          HUD (Heads-Up Display) Level
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {hudModes.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setHudMode(h.id)}
              className={`p-3.5 rounded-lg border text-left transition-all ${
                hudMode === h.id
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-sm"
                  : "border-border/60 bg-secondary/40 text-foreground hover:border-border"
              }`}
            >
              <div className="font-display font-bold text-xs uppercase">{h.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{h.desc}</div>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
