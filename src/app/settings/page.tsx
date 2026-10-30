"use client";

import React, { useState } from "react";
import { Settings, CheckCircle2 } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useAuthStore } from "@/store/useAuthStore";
import { UserProfileSection } from "@/components/settings/UserProfileSection";
import { ThemeSection } from "@/components/settings/ThemeSection";
import { AudioSection } from "@/components/settings/AudioSection";

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    soundEnabled,
    setSoundEnabled,
    sfxVolume,
    setSfxVolume,
    screenShake,
    setScreenShake,
  } = useGameStore();

  const { updateUserSettings } = useAuthStore();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = async () => {
    await updateUserSettings({
      theme,
      soundEnabled,
      screenShake,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="container max-w-4xl px-4 py-8 font-sans">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono text-primary mb-2">
          <Settings className="h-3.5 w-3.5 text-primary" />
          PREFERENCES & PROFILE
        </div>
        <h1 className="text-3xl font-black font-display tracking-tight text-foreground">
          Settings
        </h1>
      </div>

      <div className="space-y-6">
        {/* User Account / Profile Info */}
        <UserProfileSection />

        {/* Visual Theme */}
        <ThemeSection
          theme={theme}
          setTheme={(newTheme) => {
            setTheme(newTheme);
            updateUserSettings({ theme: newTheme });
          }}
        />

        {/* Audio Synthesis & Effects */}
        <AudioSection
          soundEnabled={soundEnabled}
          setSoundEnabled={(enabled) => {
            setSoundEnabled(enabled);
            updateUserSettings({ soundEnabled: enabled });
          }}
          sfxVolume={sfxVolume}
          setSfxVolume={setSfxVolume}
          screenShake={screenShake}
          setScreenShake={(shake) => {
            setScreenShake(shake);
            updateUserSettings({ screenShake: shake });
          }}
        />

        {/* Save Confirmation Notification */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Settings saved & synced to user account.
            </span>
          ) : (
            <span />
          )}

          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-display font-bold px-6 py-2 rounded-lg text-xs hover:opacity-90 transition-all glow-primary"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
