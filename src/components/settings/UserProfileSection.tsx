"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus,
  KeyRound,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export function UserProfileSection() {
  const { user, openAuthModal, logout, updateProfile, changePassword } = useAuthStore();

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditUsername(user.username);
    }
  }, [user]);

  // Debounced check for edited username uniqueness
  useEffect(() => {
    if (!isEditingProfile || !user) return;
    const clean = editUsername.trim();
    if (clean.length < 3) {
      setUsernameStatus({ checking: false });
      return;
    }

    if (clean.toLowerCase() === user.username.toLowerCase()) {
      setUsernameStatus({ checking: false, available: true, message: "Current username" });
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus({ checking: true });
      try {
        const res = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(clean)}&excludeUserId=${user.id}`
        );
        const data = await res.json();
        setUsernameStatus({ checking: false, available: data.available, message: data.message });
      } catch {
        setUsernameStatus({ checking: false });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [editUsername, isEditingProfile, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const cleanUsername = editUsername.trim();
    if (usernameStatus.available === false) {
      setProfileError(`Username '${cleanUsername}' is already taken. Please choose another.`);
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateProfile({
        name: editName.trim(),
        username: cleanUsername,
      });

      if (!res.success) {
        setProfileError(res.error || "Failed to update profile.");
      } else {
        setProfileSuccess("Profile details updated successfully.");
        setIsEditingProfile(false);
        setTimeout(() => setProfileSuccess(null), 4000);
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      if (!res.success) {
        setPasswordError(res.error || "Failed to change password.");
      } else {
        setPasswordSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setIsChangingPassword(false);
        setTimeout(() => setPasswordSuccess(null), 4000);
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md shadow-sm font-sans space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold font-display tracking-tight text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            USER ACCOUNT & PROFILE
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Manage your unique username, display name, and security credentials
          </p>
        </div>
      </div>

      {/* Global Alerts */}
      {profileSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{profileSuccess}</span>
        </div>
      )}
      {passwordSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{passwordSuccess}</span>
        </div>
      )}

      {user ? (
        <div className="space-y-4">
          {/* Main User Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-secondary/40 border border-border/60 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 text-primary font-bold font-display text-base glow-primary">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-foreground text-sm flex items-center gap-2">
                  <span>@{user.username}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1 font-mono">
                    <ShieldCheck className="h-3 w-3" />
                    Active
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Full Name: {user.name}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(!isEditingProfile);
                  setProfileError(null);
                  if (user) {
                    setEditName(user.name);
                    setEditUsername(user.username);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  isEditingProfile
                    ? "bg-primary text-primary-foreground border-primary glow-primary"
                    : "bg-secondary hover:bg-secondary/80 text-foreground border-border hover:border-primary/50"
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                {isEditingProfile ? "CANCEL" : "EDIT PROFILE"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(!isChangingPassword);
                  setPasswordError(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  isChangingPassword
                    ? "bg-amber-500 text-black border-amber-500 font-bold"
                    : "bg-secondary hover:bg-secondary/80 text-foreground border-border hover:border-amber-400/50"
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                {isChangingPassword ? "CLOSE" : "CHANGE PASSWORD"}
              </button>

              <button
                type="button"
                onClick={() => logout()}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive border border-border hover:border-destructive/30 transition-all font-bold text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                LOG OUT
              </button>
            </div>
          </div>

          {/* Edit Profile Drawer / Form */}
          {isEditingProfile && (
            <div className="p-4 rounded-xl bg-card border border-primary/40 shadow-lg animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold font-display uppercase tracking-wider text-primary">
                <Edit3 className="h-4 w-4" />
                Update Profile Info
              </div>

              {profileError && (
                <div className="mb-3 p-2.5 rounded-lg bg-destructive/15 border border-destructive/40 text-rose-400 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground uppercase mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground font-sans text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground uppercase mb-1">
                      Unique Username
                    </label>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. Aditya"
                    />
                    <div className="mt-1 text-[10px] font-mono">
                      {usernameStatus.checking ? (
                        <span className="text-muted-foreground animate-pulse">Checking availability...</span>
                      ) : usernameStatus.available === false ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          ⚠️ {usernameStatus.message || "Username is already taken"}
                        </span>
                      ) : usernameStatus.available === true && editUsername !== user.username ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          ✓ Username is available
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile || usernameStatus.available === false}
                    className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-display font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all glow-primary disabled:opacity-50"
                  >
                    {isSavingProfile ? "SAVING..." : "SAVE PROFILE"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Change Password Drawer / Form */}
          {isChangingPassword && (
            <div className="p-4 rounded-xl bg-card border border-amber-500/40 shadow-lg animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold font-display uppercase tracking-wider text-amber-400">
                <Lock className="h-4 w-4" />
                Change Account Password
              </div>

              {passwordError && (
                <div className="mb-3 p-2.5 rounded-lg bg-destructive/15 border border-destructive/40 text-rose-400 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground uppercase mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground font-sans text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground uppercase mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground font-sans text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      placeholder="Min 6 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground uppercase mb-1">
                      Re-enter New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground font-sans text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordError(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="px-5 py-2 rounded-lg bg-amber-500 text-black font-display font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all disabled:opacity-50"
                  >
                    {isSavingPassword ? "UPDATING..." : "UPDATE PASSWORD"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-secondary/30 border border-dashed border-border font-mono text-xs">
          <div>
            <div className="font-bold text-foreground">Not signed in</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Log in to sync your theme and preferences with your cloud account.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground hover:border-primary/50 text-xs font-bold transition-all"
            >
              <LogIn className="h-3.5 w-3.5 text-primary" />
              LOG IN
            </button>
            <button
              type="button"
              onClick={() => openAuthModal("register")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all glow-primary"
            >
              <UserPlus className="h-3.5 w-3.5" />
              REGISTER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
