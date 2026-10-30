export type GameMode = "classic" | "endless" | "daily";
export type Difficulty = "easy" | "medium" | "hard";
export type HudMode = "minimal" | "standard" | "analytical";
export type Theme = "midnight" | "cyberpunk" | "terminal" | "amber" | "light";
export type WordPackType = "core" | "developer" | "cybersecurity" | "sysadmin";
export type PlayerArchetype =
  | "The Calculated Strategist"
  | "The Speed Demon"
  | "The High Roller"
  | "The Zen Master";

export type PacketOutcome = "clean" | "corrupted" | "missed" | "ignored";

export interface PacketDefinition {
  id: string;
  code: string;              // String to type (e.g. "AUTH_KEY", "0x9F4C", "SIGMA")
  reward: number;            // R: advertised reward points (e.g. 100)
  corruptionProbability: number; // p: probability of corruption (0.05 to 0.85)
  corruptionPenalty: number; // C: points deducted if corrupted (e.g. 60)
  interceptionCost: number;  // K: upfront cost if applicable
  expectedValue: number;     // EV = (1 - p)*R - p*C - K
  durationSeconds: number;   // Time until packet hits bottom
  speed: number;             // Fall speed in pixels/sec
  riskRating: "low" | "medium" | "high" | "critical";
  valuePerSecond: number;    // EV / estimated typing duration
  spawnTimeMs: number;
  laneIndex: number;         // 0 to 3 horizontal column
  specialType?: "standard" | "shield" | "high_roller";
}

export interface PacketEvent {
  packetId: string;
  code: string;
  reward: number;
  corruptionProbability: number;
  corruptionPenalty: number;
  expectedValue: number;
  action: "intercepted" | "missed" | "ignored";
  outcome: PacketOutcome;
  timestampMs: number;
  pointsDelta: number;
  pureTypingPoints?: number;
  multiplierPoints?: number;
  speedBonusPoints?: number;
  wpm: number;
  accuracy: number;
  specialType?: "standard" | "shield" | "high_roller";
}

export interface GameRunResult {
  runId: string;
  userId?: string;
  mode: GameMode;
  difficulty: Difficulty;
  seed: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  finalScore: number;
  actualTypingScore?: number;
  multiplierScore?: number;
  speedBonusScore?: number;
  expectedScore?: number;
  luckScore?: number;
  wpm: number;
  accuracy: number;
  totalPacketsSpawned: number;
  packetsCaptured: number;
  cleanCount: number;
  corruptedCount: number;
  missedCount: number;
  ignoredCount: number;
  totalExpectedValue: number;
  totalRealizedScore: number;
  maxCombo: number;
  events: PacketEvent[];
  status: "validated" | "rejected";
  typoMap?: Record<string, number>;
  archetype?: PlayerArchetype;
  wordPack?: WordPackType;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  isVerified: boolean;
  level: number;
  xp: number;
  lifetimeScore: number;
  bestScore: number;
  gamesPlayed: number;
  packetsClean: number;
  packetsCorrupted: number;
  packetsMissed: number;
  bestWpm: number;
  avgAccuracy: number;
  createdAt: string;
}

export interface UserSettings {
  theme: Theme;
  accentColor: string;
  hudMode: HudMode;
  preferredDifficulty: Difficulty;
  preferredMode: GameMode;
  soundEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
  keyboardClicks: boolean;
  screenShake: boolean;
  particleEffects: boolean;
  reducedMotion: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  runId?: string;
  userId: string;
  username: string;
  displayName: string;
  score: number;
  mode: GameMode;
  difficulty: Difficulty;
  wpm: number;
  accuracy: number;
  cleanPackets: number;
  corruptedPackets?: number;
  date: string;
}

export interface AuthSession {
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  lastUsedAt: string;
  isCurrent?: boolean;
}
