"use client";

import React, { useState } from "react";
import { KeyRound, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface PasswordSectionProps {
  onSuccess: () => void;
}

export function PasswordSection({ onSuccess }: PasswordSectionProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
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
        text: "Password successfully updated! Other sessions signed out.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess();
    } catch {
      setPasswordMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <section className="p-6 rounded-xl border border-border/80 bg-card/75 backdrop-blur-md shadow-xl">
      <div className="flex items-center gap-2 text-sm font-bold font-display text-foreground mb-4">
        <KeyRound className="h-4 w-4 text-primary" />
        Password Management
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
          <label className="block text-xs font-semibold text-foreground mb-1">
            Current Password
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
          <label className="block text-xs font-semibold text-foreground mb-1">New Password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 characters, 1 uppercase, 1 number"
            className="w-full rounded-md bg-secondary/60 border border-border px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            className="w-full rounded-md bg-secondary/60 border border-border px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={passwordLoading}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-display font-bold px-4 py-2 rounded-lg text-xs border border-border transition-colors disabled:opacity-50"
        >
          {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Update Password
        </button>
      </form>
    </section>
  );
}
