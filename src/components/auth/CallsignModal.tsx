"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, X, ArrowRight, Shield } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

export function CallsignModal() {
  const { username, isCallsignModalOpen, closeCallsignModal, setUsername } = useSessionStore();
  const [inputVal, setInputVal] = useState(username || "");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCallsignModalOpen) {
      setInputVal(username || "");
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 80);
    }
  }, [isCallsignModalOpen, username]);

  if (!isCallsignModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputVal.trim().toUpperCase();

    if (clean.length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }

    if (clean.length > 15) {
      setError("Username cannot exceed 15 characters.");
      return;
    }

    if (!/^[A-Z0-9_-]+$/.test(clean)) {
      setError("Use only letters, numbers, hyphens, or underscores.");
      return;
    }

    setUsername(clean);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm rounded-xl border border-primary/40 bg-card p-5 shadow-2xl relative font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground font-display">
                SET USERNAME
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCallsignModal}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1 uppercase">
              Choose Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-mono font-bold text-sm">
                @
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                maxLength={15}
                placeholder="NEO"
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary/80 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm font-mono font-bold uppercase tracking-wider text-foreground transition-all"
              />
            </div>
            {error && (
              <p className="mt-1 text-xs text-destructive font-mono flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-muted-foreground font-mono">Suggestions:</span>
            {["NEO", "CIPHER", "ALEX", "VALKYRIE"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setInputVal(p);
                  setError(null);
                }}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground hover:text-primary transition-all"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={closeCallsignModal}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-display font-bold hover:opacity-90 transition-opacity glow-primary"
            >
              Start Playing
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
