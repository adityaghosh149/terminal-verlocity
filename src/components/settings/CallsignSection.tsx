"use client";

import React, { useState } from "react";
import { User, Edit2, RotateCcw, Check, Shield } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

export function CallsignSection() {
  const { username, setUsername, clearSession } = useSessionStore();
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(username || "");
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
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
      setError("Use only letters, numbers, hyphens, and underscores.");
      return;
    }

    setUsername(clean);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="p-6 rounded-xl border border-border/80 bg-card/75 backdrop-blur-md shadow-lg font-sans">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border/60">
        <User className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground font-display">
          USERNAME
        </h2>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <div className="relative max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-xs font-mono">
                @
              </span>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                maxLength={15}
                placeholder="USERNAME"
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
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setError(null);
              }}
              className="px-3 py-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-secondary/50 border border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs font-mono">
              {username ? username.charAt(0) : "?"}
            </div>
            <div>
              <div className="text-xs font-black text-foreground font-mono">
                {username ? `@${username}` : "No username set"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setInputVal(username || "");
                setIsEditing(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all font-mono"
            >
              <Edit2 className="h-3 w-3" />
              {username ? "Change" : "Set Username"}
            </button>

            {username && (
              <button
                type="button"
                onClick={clearSession}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary border border-border text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all font-mono"
                title="Reset Username"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
