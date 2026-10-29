"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, X, Zap, Shield, ArrowRight } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

export function CallsignModal() {
  const { username, isCallsignModalOpen, closeCallsignModal, setUsername } = useSessionStore();
  const [callsignInput, setCallsignInput] = useState(username || "");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCallsignModalOpen) {
      setCallsignInput(username || "");
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isCallsignModalOpen, username]);

  if (!isCallsignModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = callsignInput.trim().toUpperCase();

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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl border border-primary/40 bg-card p-6 shadow-2xl relative overflow-hidden font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle scanline / glow effect */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground tracking-wider uppercase font-display">
                OPERATIVE CALLSIGN
              </h2>
              <p className="text-[10px] text-muted-foreground">
                SESSION IDENTIFIER // ACTIVE UNTIL REFRESH
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCallsignModal}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Explanatory note */}
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed font-sans">
          Enter a handle to identify your runs on the telemetry dashboard and global leaderboard. No passwords or accounts required.
          <span className="block text-[11px] text-primary/80 font-mono mt-1">
            ⚡ Resets automatically when the browser is closed or refreshed.
          </span>
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">
              YOUR CALLSIGN / HANDLE:
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">
                @
              </span>
              <input
                ref={inputRef}
                type="text"
                value={callsignInput}
                onChange={(e) => {
                  setCallsignInput(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                maxLength={15}
                placeholder="VALKYRIE_01"
                className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-secondary/60 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm font-mono font-bold tracking-wider text-foreground placeholder:text-muted-foreground/50 uppercase transition-all"
              />
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-destructive font-mono flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          {/* Quick random generator buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] text-muted-foreground">SUGGEST:</span>
            {["CIPHER", "PHANTOM", "NEO_99", "SPECTRE"].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setCallsignInput(preset);
                  setError(null);
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-secondary/80 border border-border/80 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={closeCallsignModal}
              className="px-4 py-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-display font-black tracking-wider hover:opacity-90 transition-opacity glow-primary"
            >
              <Zap className="h-3.5 w-3.5" />
              ENGAGE SESSION
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
