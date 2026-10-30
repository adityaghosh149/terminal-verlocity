import { create } from "zustand";
import { useSessionStore } from "./useSessionStore";
import { useGameStore } from "./useGameStore";

export interface UserSettings {
  theme?: string;
  preferredDifficulty?: "easy" | "medium" | "hard";
  preferredMode?: "classic" | "endless" | "daily";
  soundEnabled?: boolean;
  screenShake?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  settings?: UserSettings;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: "login" | "register";
  openAuthModal: (tab?: "login" | "register") => void;
  closeAuthModal: () => void;
  checkAuth: () => Promise<void>;
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  updateProfile: (profile: { name?: string; username?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (data: { currentPassword: string; newPassword: string; confirmNewPassword: string }) => Promise<{ success: boolean; error?: string }>;
}

function applySettingsToGameStore(settings?: UserSettings) {
  if (!settings) return;
  const game = useGameStore.getState();
  if (settings.theme) game.setTheme(settings.theme as any);
  if (settings.soundEnabled !== undefined) game.setSoundEnabled(settings.soundEnabled);
  if (settings.screenShake !== undefined) game.setScreenShake(settings.screenShake);
  if (settings.preferredDifficulty) game.setDifficulty(settings.preferredDifficulty);
  if (settings.preferredMode) game.setMode(settings.preferredMode);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthModalOpen: false,
  authModalTab: "login",

  openAuthModal: (tab = "login") => set({ isAuthModalOpen: true, authModalTab: tab }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch("/api/auth/me", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          set({ user: data.user, isLoading: false });
          useSessionStore.getState().setUsername(data.user.username);
          applySettingsToGameStore(data.user.settings);
          return;
        }
      }
      set({ user: null, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  login: async ({ username, password }) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      set({ user: data.user, isAuthModalOpen: false });
      useSessionStore.getState().setUsername(data.user.username);
      applySettingsToGameStore(data.user.settings);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error. Please try again." };
    }
  },

  register: async ({ name, username, password }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      set({ user: data.user, isAuthModalOpen: false });
      useSessionStore.getState().setUsername(data.user.username);
      applySettingsToGameStore(data.user.settings);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error. Please try again." };
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      set({ user: null });
      useSessionStore.getState().clearSession();
    }
  },

  updateUserSettings: async (newSettings) => {
    const currentUser = get().user;
    if (!currentUser) return;

    // Optimistically update
    const mergedSettings = { ...(currentUser.settings || {}), ...newSettings };
    set({ user: { ...currentUser, settings: mergedSettings } });
    applySettingsToGameStore(mergedSettings);

    try {
      await fetch("/api/player/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
    } catch (err) {
      console.error("Failed to sync user settings:", err);
    }
  },

  updateProfile: async ({ name, username }) => {
    try {
      const res = await fetch("/api/player/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to update profile." };
      }

      set({ user: data.user });
      if (data.user?.username) {
        useSessionStore.getState().setUsername(data.user.username);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error. Please try again." };
    }
  },

  changePassword: async ({ currentPassword, newPassword, confirmNewPassword }) => {
    try {
      const res = await fetch("/api/player/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to change password." };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error. Please try again." };
    }
  },
}));
