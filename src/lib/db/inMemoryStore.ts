export interface StoredRun {
  runId: string;
  username: string;
  mode: string;
  difficulty: string;
  seed: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  finalScore: number;
  actualTypingScore?: number;
  rawTypingScore?: number;
  accuracyPenaltyPct?: number;
  accuracyPenaltyScore?: number;
  multiplierScore?: number;
  speedBonusScore?: number;
  expectedScore?: number;
  luckScore?: number;
  wpm: number;
  accuracy: number;
  packetsCaptured: number;
  cleanCount: number;
  corruptedCount: number;
  missedCount: number;
  ignoredCount: number;
  totalExpectedValue: number;
  totalRealizedScore: number;
  maxCombo: number;
  status: "validated" | "rejected";
  validationReason?: string;
  typoMap?: Record<string, number>;
  wordPack?: string;
  createdAt: Date;
}

export interface StoredUser {
  id: string;
  name: string;
  username: string;
  password: string;
  settings?: {
    theme?: string;
    preferredDifficulty?: "easy" | "medium" | "hard";
    preferredMode?: "classic" | "endless" | "daily";
    soundEnabled?: boolean;
    screenShake?: boolean;
  };
  createdAt: Date;
}

export interface StoredPresence {
  sessionId: string;
  userId?: string;
  username?: string;
  path?: string;
  lastSeen: number;
}

declare global {
  // eslint-disable-next-line no-var
  var inMemoryGameRuns: StoredRun[] | undefined;
  // eslint-disable-next-line no-var
  var inMemoryUsers: StoredUser[] | undefined;
  // eslint-disable-next-line no-var
  var inMemoryPresence: Map<string, StoredPresence> | undefined;
}

if (!global.inMemoryGameRuns) {
  global.inMemoryGameRuns = [];
}
if (!global.inMemoryUsers) {
  global.inMemoryUsers = [];
}
if (!global.inMemoryPresence) {
  global.inMemoryPresence = new Map<string, StoredPresence>();
}

export const inMemoryStore = {
  // Runs
  addRun(run: StoredRun) {
    const roundToTwo = (val?: number) =>
      typeof val === "number" ? Math.round((val + Number.EPSILON) * 100) / 100 : val;
    const cleaned: StoredRun = {
      ...run,
      finalScore: roundToTwo(run.finalScore)!,
      actualTypingScore: roundToTwo(run.actualTypingScore),
      rawTypingScore: roundToTwo(run.rawTypingScore),
      accuracyPenaltyPct: roundToTwo(run.accuracyPenaltyPct),
      accuracyPenaltyScore: roundToTwo(run.accuracyPenaltyScore),
      multiplierScore: roundToTwo(run.multiplierScore),
      speedBonusScore: roundToTwo(run.speedBonusScore),
      expectedScore: roundToTwo(run.expectedScore),
      luckScore: roundToTwo(run.luckScore),
      wpm: roundToTwo(run.wpm)!,
      accuracy: roundToTwo(run.accuracy)!,
      durationSeconds: roundToTwo(run.durationSeconds)!,
      totalExpectedValue: roundToTwo(run.totalExpectedValue)!,
      totalRealizedScore: roundToTwo(run.totalRealizedScore)!,
    };
    global.inMemoryGameRuns!.unshift(cleaned);
  },
  findRun(runId: string): StoredRun | undefined {
    return global.inMemoryGameRuns!.find((r) => r.runId === runId);
  },
  getRuns(filter?: {
    mode?: string;
    difficulty?: string;
    username?: string;
    seed?: string;
    excludeMode?: string;
  }): StoredRun[] {
    let result = [...global.inMemoryGameRuns!];
    if (filter?.seed) {
      result = result.filter((r) => r.seed === filter.seed);
    }
    if (filter?.mode && filter.mode !== "all") {
      result = result.filter((r) => r.mode === filter.mode);
    }
    if (filter?.excludeMode) {
      result = result.filter((r) => r.mode !== filter.excludeMode);
    }
    if (filter?.difficulty && filter.difficulty !== "all") {
      result = result.filter((r) => r.difficulty === filter.difficulty);
    }
    if (filter?.username) {
      result = result.filter((r) => r.username === filter.username);
    }
    return result.sort((a, b) => b.finalScore - a.finalScore);
  },

  // Users
  addUser(user: StoredUser) {
    global.inMemoryUsers!.push(user);
  },
  findUserByUsername(username: string): StoredUser | undefined {
    return global.inMemoryUsers!.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
  },
  findUserById(id: string): StoredUser | undefined {
    return global.inMemoryUsers!.find((u) => u.id === id);
  },

  // Presence / Active Online Users
  recordPresence(sessionId: string, userId?: string, username?: string, path?: string): number {
    const now = Date.now();
    global.inMemoryPresence!.set(sessionId, {
      sessionId,
      userId,
      username: username || "guest",
      path: path || "/",
      lastSeen: now,
    });
    // Evict stale sessions older than 60 seconds
    for (const [id, session] of global.inMemoryPresence!.entries()) {
      if (now - session.lastSeen > 60000) {
        global.inMemoryPresence!.delete(id);
      }
    }
    return global.inMemoryPresence!.size;
  },
  getOnlineCount(): number {
    const now = Date.now();
    for (const [id, session] of global.inMemoryPresence!.entries()) {
      if (now - session.lastSeen > 60000) {
        global.inMemoryPresence!.delete(id);
      }
    }
    return global.inMemoryPresence!.size;
  },
  clear() {
    global.inMemoryGameRuns = [];
    global.inMemoryUsers = [];
    global.inMemoryPresence?.clear();
  },
};
