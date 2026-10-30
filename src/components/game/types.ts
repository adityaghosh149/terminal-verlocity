import { GameRunResult, PacketDefinition } from "@/types";

export interface FloatingFeedback {
  id: string;
  text: string;
  type: "clean" | "corrupted" | "missed";
  lane: number;
  y: number;
}

/**
 * Clean Integer Streak Combo: 3 in a row = 2x, 6 in a row = 3x, 10+ = 4x MAX
 */
export const getComboMultiplier = (c: number): number => {
  if (c >= 10) return 4;
  if (c >= 6) return 3;
  if (c >= 3) return 2;
  return 1;
};

/**
 * WPM Speed Bonus Ladder:
 * >= 30 WPM -> +20%
 * >= 50 WPM -> +35%
 * >= 70 WPM -> +50%
 * >= 90 WPM -> +75%
 * >= 110 WPM -> +100% (Double Points!)
 */
export const getSpeedBonusPercent = (wpm: number): number => {
  if (wpm >= 110) return 100;
  if (wpm >= 90) return 75;
  if (wpm >= 70) return 50;
  if (wpm >= 50) return 35;
  if (wpm >= 30) return 20;
  return 0;
};

// 4 distinct horizontal column lanes (percentages from left edge)
export const LANES = [14, 38, 62, 86] as const;

export interface PhaserGameProps {
  mode: "classic" | "endless" | "daily";
  difficulty: "easy" | "medium" | "hard";
  onGameOver?: (result: GameRunResult) => void;
}
