"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Palette,
  Volume2,
  Sliders,
  Shield,
  KeyRound,
  Laptop,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Theme, HudMode, Difficulty, GameMode, AuthSession } from "@/types";

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    hudMode,
    setHudMode,
    difficulty,
    setDifficulty,
    mode,
    setMode,
    soundEnabled,
    setSoundEnabled,
    sfxVolume,
    setSfxVolume,
    screenShake,
    setScreenShake,
    reducedMotion,
    setReducedMotion,
  } = useGameStore();

  const { user, isAuthenticated } = useAuthStore();

  // Settings saving state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Active sessions state
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const themes: { id: Theme; label: string; desc: string }[] = [
    { id: "midnight", label: "Midnight", desc: "Dark navy and electric cyan" },
    { id: "cyberpunk", label: "Cyberpunk", desc: "Deep purple and neon magenta" },
    { id: "terminal", label: "Terminal Green", desc: "Classic phosphor green on black" },
    { id: "amber", label: "Amber Protocol", desc: "Warm charcoal and amber glow" },
    { id: "light", label: "Light Mode", desc: "Clean modern surfaces with high contrast" },
  ];

  const hudModes: { id: HudMode; label: string; desc: string }[] = [
    { id: "minimal", label: "Minimal", desc: "Reward value and corruption probability" },
    { id: "standard", label: "Standard", desc: "Reward, risk rate, and visual risk indicators" },
    { id: "analytical", label: "Analytical", desc: "Full telemetry: Expected Value (EV) & Net VPS" },
  ];

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

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passphrases do not match." });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordMsg({ type: "error", text: data.error || "Password change failed." });
        return;
      }

      setPasswordMsg({
        type: "success",
        text: "Passphrase successfully updated! Other sessions revoked.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      loadSessions();
    } catch {
      setPasswordMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setPasswordLoading(false);
    }
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
    <div className="container max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono text-primary mb-2">
          <Settings className="h-3.5 w-3.5 text-primary" />
          SYSTEM CONFIGURATION
        </div>
        <h1 className="text-3xl font-black font-mono tracking-tight text-foreground">
          TERMINAL SETTINGS
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure visual themes, audio synthesis, HUD telemetry, and account security
        </p>
      </div>

      <div className="space-y-8">
        {/* Visual Theme Section */}
        <section className="p-6 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold font-mono text-foreground mb-4">
            <Palette className="h-4 w-4 text-primary" />
            INTERFACE THEME & CHROMATICS
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-3.5 rounded-lg border text-left transition-all font-mono ${
                  theme === t.id
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                    : "border-border/60 bg-secondary/40 text-foreground hover:border-border"
                }`}
              >
                <div className="font-bold text-xs uppercase">{t.label}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{t.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Telemetry & HUD Mode */}
        <section className="p-6 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold font-mono text-foreground mb-4">
            <Sliders className="h-4 w-4 text-primary" />
            HEADS-UP DISPLAY (HUD) INFORMATION LEVEL
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {hudModes.map((h) => (
              <button
                key={h.id}
                onClick={() => setHudMode(h.id)}
                className={`p-3.5 rounded-lg border text-left transition-all font-mono ${
                  hudMode === h.id
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                    : "border-border/60 bg-secondary/40 text-foreground hover:border-border"
                }`}
              >
                <div className="font-bold text-xs uppercase">{h.label}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{h.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Audio Synthesis & Effects */}
        <section className="p-6 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md shadow-xl font-mono text-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-4">
            <Volume2 className="h-4 w-4 text-primary" />
            AUDIO SYNTHESIZER & IMMERSION
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
              <div>
                <span className="font-bold text-foreground block">Audio Synthesizer Engine</span>
                <span className="text-muted-foreground text-[11px]">
                  Zero-latency procedural Web Audio chimes, alarms, and glitch sound effects
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
                <span className="font-bold text-foreground">Sound Effects Volume</span>
                <span className="text-primary font-bold">{Math.round(sfxVolume * 100)}%</span>
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
                  Impact vibrations on packet corruption and arcade CRT scanlines
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

        {/* Save Settings Action */}
        <div className="flex items-center justify-between">
          {saveSuccess ? (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Settings successfully synchronized and saved.
            </span>
          ) : (
            <span />
          )}

          <button
            onClick={handleSaveSettings}
            disabled={saveLoading}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-mono font-bold px-6 py-2.5 rounded-lg text-xs hover:opacity-90 transition-all glow-primary"
          >
            {saveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            PERSIST CONFIGURATION
          </button>
        </div>

        {/* Account Security (Only if Authenticated) */}
        {isAuthenticated && (
          <>
            {/* Change Password */}
            <section className="p-6 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-2 text-sm font-bold font-mono text-foreground mb-4">
                <KeyRound className="h-4 w-4 text-primary" />
                SECURITY & PASSPHRASE MANAGEMENT
              </div>

              {passwordMsg && (
                <div
                  className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-xs ${
                    passwordMsg.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      : "bg-destructive/15 border border-destructive/30 text-destructive"
                  }`}
                >
                  {passwordMsg.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    CURRENT PASSPHRASE
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-md bg-secondary/60 border border-border px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    NEW PASSPHRASE
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    className="w-full rounded-md bg-secondary/60 border border-border px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    CONFIRM NEW PASSPHRASE
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md bg-secondary/60 border border-border px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-mono font-bold px-4 py-2 rounded-lg text-xs border border-border transition-colors disabled:opacity-50"
                >
                  {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  UPDATE PASSPHRASE
                </button>
              </form>
            </section>

            {/* Active Sessions */}
            <section className="p-6 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md shadow-xl font-mono text-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Laptop className="h-4 w-4 text-primary" />
                  ACTIVE REFRESH SESSIONS
                </div>
                <button
                  onClick={handleRevokeAllSessions}
                  className="text-destructive hover:underline text-xs flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Terminate All Sessions
                </button>
              </div>

              <div className="space-y-2">
                {sessions.map((s) => (
                  <div
                    key={s.sessionId}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40"
                  >
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-2">
                        {s.userAgent}
                        {s.isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Last active: {new Date(s.lastUsedAt).toLocaleString()}
                      </div>
                    </div>

                    {!s.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(s.sessionId)}
                        className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-destructive/10"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
