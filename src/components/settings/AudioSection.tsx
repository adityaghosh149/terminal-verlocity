"use client";

import React from "react";
import { Volume2 } from "lucide-react";

interface AudioSectionProps {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  sfxVolume: number;
  setSfxVolume: (vol: number) => void;
  screenShake: boolean;
  setScreenShake: (shake: boolean) => void;
}

export function AudioSection({
  soundEnabled,
  setSoundEnabled,
  sfxVolume,
  setSfxVolume,
  screenShake,
  setScreenShake,
}: AudioSectionProps) {
  return (
    <section className="p-6 rounded-xl border border-border/80 bg-card/75 backdrop-blur-md shadow-xl text-xs">
      <div className="flex items-center gap-2 text-sm font-bold font-display text-foreground mb-4">
        <Volume2 className="h-4 w-4 text-primary" />
        Sound & Haptic Effects
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
          <div>
            <span className="font-bold text-foreground block">Audio Synthesizer Engine</span>
            <span className="text-muted-foreground text-[11px]">
              Real-time procedural Web Audio typing clicks, reward chimes, and glitch alerts
            </span>
          </div>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
        </div>

        <div className="p-3 rounded-lg bg-secondary/30 border border-border/40">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-foreground">Sound Volume</span>
            <span className="text-primary font-bold font-mono">{Math.round(sfxVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={sfxVolume}
            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
            className="w-full accent-primary cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
          <div>
            <span className="font-bold text-foreground block">Screen Shake & CRT Scanlines</span>
            <span className="text-muted-foreground text-[11px]">
              Impact effects on packet corruption and arcade CRT scanlines
            </span>
          </div>
          <input
            type="checkbox"
            checked={screenShake}
            onChange={(e) => setScreenShake(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
        </div>
      </div>
    </section>
  );
}
