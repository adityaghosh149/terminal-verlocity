"use client";

import React, { useState } from "react";
import { User, Edit2, RotateCcw, Check, Shield } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

export function CallsignSection() {
  const { username, setUsername, clearSession } = useSessionStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newCallsign, setNewCallsign] = useState(username || "");
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCallsign.trim().toUpperCase();

    if (clean.length < 2) {
      setError("Callsign must be at least 2 characters.");
      return;
    }

    if (clean.length > 15) {
      setError("Callsign cannot exceed 15 characters.");
      return;
    }

    if (!/^[A-Z0-9_-]+$/.test(clean)) {
      setError("Use only letters, numbers, hyphens, and underscores.");
      return;
    }

    setUsername(clean);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="p-6 rounded-xl border border-border/80 bg-card/75 backdrop-blur-md shadow-lg font-mono">
      <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-border/60">
        <User className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold tracking-wider text-foreground uppercase">
          OPERATIVE CALLSIGN // SESSION IDENTITY
        </h2>
      </div>

      <p className="text-xs text-muted-foreground mb-4 font-sans leading-relaxed">
        Your callsign identifies your score records on the leaderboard and telemetry dashboards.
        No passwords or registered accounts are required.
      </p>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <div className="relative max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-xs">
                @
              </span>
              <input
                type="text"
                value={newCallsign}
                onChange={(e) => {
                  setNewCallsign(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                maxLength={15}
                placeholder="ENTER_HANDLE"
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary/80 border border-border focus:border-primary text-xs font-mono font-bold text-foreground uppercase tracking-wider transition-all"
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-1 text-xs text-destructive font-mono flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity glow-primary"
            >
              <Check className="h-3 w-3" />
              SAVE
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setError(null);
              }}
              className="px-3 py-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              CANCEL
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-secondary/50 border border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs">
              {username ? username.charAt(0) : "?"}
            </div>
            <div>
              <div className="text-xs font-black text-foreground">
                {username ? `@${username}` : "NO CALLSIGN CONFIGURED"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {username
                  ? "Active for this browser session"
                  : "Click edit to set your handle"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNewCallsign(username || "");
                setIsEditing(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all font-mono"
            >
              <Edit2 className="h-3 w-3" />
              {username ? "CHANGE" : "SET CALLSIGN"}
            </button>

            {username && (
              <button
                type="button"
                onClick={clearSession}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary border border-border text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all font-mono"
                title="Clear current session callsign"
              >
                <RotateCcw className="h-3 w-3" />
                RESET
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground font-sans">
        <span className="font-bold text-primary font-mono block mb-0.5">
          ℹ️ SESSION LIFECYCLE:
        </span>
        Callsigns are kept purely in temporary browser memory. When you refresh the webpage (F5)
        or close the browser tab, your session resets automatically.
      </div>
    </div>
  );
}
