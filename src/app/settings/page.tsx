"use client";

import React, { useState } from "react";
import { Settings, CheckCircle2 } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { CallsignSection } from "@/components/settings/CallsignSection";
import { ThemeSection } from "@/components/settings/ThemeSection";
import { AudioSection } from "@/components/settings/AudioSection";

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    hudMode,
    setHudMode,
    soundEnabled,
    setSoundEnabled,
    sfxVolume,
    setSfxVolume,
    screenShake,
    setScreenShake,
  } = useGameStore();

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="container max-w-4xl px-4 py-8 font-sans">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono text-primary mb-2">
          <Settings className="h-3.5 w-3.5 text-primary" />
          SYSTEM CONFIGURATION
        </div>
        <h1 className="text-3xl font-black font-display tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure visual themes, audio synthesizer, HUD information, and operative session callsign
        </p>
      </div>

      <div className="space-y-8">
        {/* Session Callsign Configuration */}
        <CallsignSection />

        {/* Visual Theme and HUD Level */}
        <ThemeSection
          theme={theme}
          setTheme={setTheme}
          hudMode={hudMode}
          setHudMode={setHudMode}
        />

        {/* Audio Synthesis & Effects */}
        <AudioSection
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          sfxVolume={sfxVolume}
          setSfxVolume={setSfxVolume}
          screenShake={screenShake}
          setScreenShake={setScreenShake}
        />

        {/* Save Confirmation Notification */}
        <div className="flex items-center justify-between">
          {saveSuccess ? (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Settings successfully preserved locally.
            </span>
          ) : (
            <span />
          )}

          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-display font-bold px-6 py-2.5 rounded-lg text-xs hover:opacity-90 transition-all glow-primary"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
