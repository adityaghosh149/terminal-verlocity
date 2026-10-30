"use client";

import React, { useState, useEffect } from "react";
import { X, Lock, User, Sparkles, LogIn, UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthModal() {
  const { isAuthModalOpen, authModalTab, closeAuthModal, openAuthModal, login, register } =
    useAuthStore();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  useEffect(() => {
    setTab(authModalTab);
    setError(null);
    setUsernameStatus({ checking: false });
  }, [authModalTab, isAuthModalOpen]);

  // Debounced check for registration username uniqueness
  useEffect(() => {
    if (tab !== "register" || username.trim().length < 3) {
      setUsernameStatus({ checking: false });
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus({ checking: true });
      try {
        const res = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(username.trim())}`
        );
        const data = await res.json();
        setUsernameStatus({ checking: false, available: data.available, message: data.message });
      } catch {
        setUsernameStatus({ checking: false });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, tab]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === "register" && usernameStatus.available === false) {
      setError(`Username '${username}' is already taken. Please choose another.`);
      return;
    }

    setIsSubmitting(true);

    try {
      if (tab === "login") {
        const res = await login({ username, password });
        if (!res.success) {
          setError(res.error || "Failed to log in.");
        }
      } else {
        const res = await register({ name, username, password });
        if (!res.success) {
          setError(res.error || "Failed to create account.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-primary/40 bg-card p-6 shadow-2xl glow-primary">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 text-primary mb-2 glow-primary">
            {tab === "login" ? <LogIn className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight text-foreground">
            {tab === "login" ? "WELCOME BACK" : "CREATE ACCOUNT"}
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            {tab === "login"
              ? "Sign in to save runs and climb the leaderboard"
              : "Register your unique username to start playing"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-secondary/60 p-1 mb-5 border border-border/60">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-display font-bold rounded-md transition-all ${
              tab === "login"
                ? "bg-primary text-primary-foreground shadow-md glow-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            LOG IN
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-display font-bold rounded-md transition-all ${
              tab === "register"
                ? "bg-primary text-primary-foreground shadow-md glow-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-destructive/15 border border-destructive/40 text-rose-400 text-xs font-mono">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <div>
              <label className="block text-[11px] font-mono text-muted-foreground uppercase mb-1">
                Full Name
              </label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditya Ghosh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border text-foreground font-sans text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-muted-foreground uppercase mb-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Aditya"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {tab === "register" && (
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                {usernameStatus.checking ? (
                  <span className="text-muted-foreground animate-pulse">Checking availability...</span>
                ) : usernameStatus.available === false ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    ⚠️ {usernameStatus.message || "Username is already taken"}
                  </span>
                ) : usernameStatus.available === true ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    ✓ Username is available
                  </span>
                ) : (
                  <span className="text-muted-foreground text-[10px]">
                    Must be unique. 3-20 characters.
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-mono text-muted-foreground uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border text-foreground font-sans text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all glow-primary disabled:opacity-50 mt-2"
          >
            {isSubmitting ? "PROCESSING..." : tab === "login" ? "LOG IN" : "CREATE ACCOUNT"}
          </button>
        </form>

        {/* Footer switch prompt */}
        <div className="mt-4 text-center text-xs text-muted-foreground font-mono">
          {tab === "login" ? (
            <span>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setTab("register")}
                className="text-primary font-bold hover:underline"
              >
                Register here
              </button>
            </span>
          ) : (
            <span>
              Already registered?{" "}
              <button
                type="button"
                onClick={() => setTab("login")}
                className="text-primary font-bold hover:underline"
              >
                Log in here
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
