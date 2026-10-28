import { create } from "zustand";
import { UserProfile, UserSettings } from "@/types";

interface AuthState {
  user: UserProfile | null;
  settings: UserSettings | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  setSettings: (settings: UserSettings | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  settings: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  setSettings: (settings) => set({ settings }),

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          set({
            user: data.user,
            settings: data.settings,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors
    } finally {
      set({ user: null, isAuthenticated: false });
      window.location.href = "/login";
    }
  },
}));
