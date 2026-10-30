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

declare global {
  // eslint-disable-next-line no-var
  var inMemoryGameRuns: StoredRun[] | undefined;
  // eslint-disable-next-line no-var
  var inMemoryUsers: StoredUser[] | undefined;
}

if (!global.inMemoryGameRuns) {
  global.inMemoryGameRuns = [];
}
if (!global.inMemoryUsers) {
  global.inMemoryUsers = [];
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
  clear() {
    global.inMemoryGameRuns = [];
    global.inMemoryUsers = [];
  },
};
