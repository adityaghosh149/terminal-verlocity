import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Theme, HudMode, Difficulty, GameMode, GameRunResult } from "@/types";
import { soundEngine } from "@/lib/audio/soundEngine";

interface GameState {
  theme: Theme;
  hudMode: HudMode;
  difficulty: Difficulty;
  mode: GameMode;
  soundEnabled: boolean;
  sfxVolume: number;
  screenShake: boolean;
  reducedMotion: boolean;
  lastRunResult: GameRunResult | null;

  setTheme: (theme: Theme) => void;
  setHudMode: (mode: HudMode) => void;
  setDifficulty: (diff: Difficulty) => void;
  setMode: (mode: GameMode) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSfxVolume: (vol: number) => void;
  setScreenShake: (shake: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  setLastRunResult: (result: GameRunResult | null) => void;
  applySettings: (settings: any) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      theme: "midnight",
      hudMode: "analytical",
      difficulty: "medium",
      mode: "classic",
      soundEnabled: true,
      sfxVolume: 0.7,
      screenShake: true,
      reducedMotion: false,
      lastRunResult: null,

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", theme);
        }
      },

      setHudMode: (hudMode) => set({ hudMode }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setMode: (mode) => set({ mode }),

      setSoundEnabled: (soundEnabled) => {
        set({ soundEnabled });
        soundEngine.setEnabled(soundEnabled);
      },

      setSfxVolume: (sfxVolume) => {
        set({ sfxVolume });
        soundEngine.setVolume(sfxVolume);
      },

      setScreenShake: (screenShake) => set({ screenShake }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setLastRunResult: (lastRunResult) => set({ lastRunResult }),

      applySettings: (settings) => {
        if (!settings) return;
        const newTheme = settings.theme || get().theme;
        const soundEnabled = settings.soundEnabled ?? get().soundEnabled;
        const sfxVolume = settings.sfxVolume ?? get().sfxVolume;

        set({
          theme: newTheme,
          hudMode: settings.hudMode || get().hudMode,
          difficulty: settings.preferredDifficulty || get().difficulty,
          mode: settings.preferredMode || get().mode,
          soundEnabled,
          sfxVolume,
          screenShake: settings.screenShake ?? get().screenShake,
          reducedMotion: settings.reducedMotion ?? get().reducedMotion,
        });

        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", newTheme);
        }
        soundEngine.setEnabled(soundEnabled);
        soundEngine.setVolume(sfxVolume);
      },
    }),
    {
      name: "terminal_velocity_game_settings",
    }
  )
);
