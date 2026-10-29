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
  createdAt: Date;
}

declare global {
  // eslint-disable-next-line no-var
  var inMemoryGameRuns: StoredRun[] | undefined;
}

if (!global.inMemoryGameRuns) {
  global.inMemoryGameRuns = [];
}

export const inMemoryStore = {
  addRun(run: StoredRun) {
    global.inMemoryGameRuns!.unshift(run);
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
};
