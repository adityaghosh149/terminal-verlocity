"use client";

import React, { useEffect, useState } from "react";
import { Settings, CheckCircle2, Loader2 } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthSession } from "@/types";

import { ThemeSection } from "@/components/settings/ThemeSection";
import { AudioSection } from "@/components/settings/AudioSection";
import { PasswordSection } from "@/components/settings/PasswordSection";
import { SessionsSection } from "@/components/settings/SessionsSection";

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    hudMode,
    setHudMode,
    difficulty,
    mode,
    soundEnabled,
    setSoundEnabled,
    sfxVolume,
    setSfxVolume,
    screenShake,
    setScreenShake,
    reducedMotion,
  } = useGameStore();

  const { isAuthenticated } = useAuthStore();

  // Settings saving state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Active sessions state
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Fetch active sessions if authenticated
  const loadSessions = async () => {
    if (!isAuthenticated) return;
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/auth/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // Ignore
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [isAuthenticated]);

  // Persist settings to MongoDB if authenticated
  const handleSaveSettings = async () => {
    setSaveLoading(true);
    setSaveSuccess(false);

    if (isAuthenticated) {
      try {
        await fetch("/api/player/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            theme,
            hudMode,
            preferredDifficulty: difficulty,
            preferredMode: mode,
            soundEnabled,
            sfxVolume,
            screenShake,
            reducedMotion,
          }),
        });
      } catch (err) {
        console.error("Save settings error:", err);
      }
    }

    setSaveLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Revoke session
  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/auth/sessions?id=${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadSessions();
      }
    } catch {
      // Ignore
    }
  };

  // Revoke all sessions
  const handleRevokeAllSessions = async () => {
    try {
      await fetch("/api/auth/logout-all", { method: "POST" });
      window.location.href = "/login";
    } catch {
      // Ignore
    }
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
          Customize visual themes, audio effects, HUD information, and account security
        </p>
      </div>

      <div className="space-y-8">
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

        {/* Save Settings Action */}
        <div className="flex items-center justify-between">
          {saveSuccess ? (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Settings successfully saved and synchronized.
            </span>
          ) : (
            <span />
          )}

          <button
            onClick={handleSaveSettings}
            disabled={saveLoading}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-display font-bold px-6 py-2.5 rounded-lg text-xs hover:opacity-90 transition-all glow-primary"
          >
            {saveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Settings
          </button>
        </div>

        {/* Account Security (Only if Authenticated) */}
        {isAuthenticated && (
          <>
            <PasswordSection onSuccess={loadSessions} />
            <SessionsSection
              sessions={sessions}
              onRevokeSession={handleRevokeSession}
              onRevokeAllSessions={handleRevokeAllSessions}
            />
          </>
        )}
      </div>
    </div>
  );
}
