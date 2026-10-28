import { Difficulty, PacketDefinition, PacketOutcome, PacketEvent } from "@/types";

/**
 * Seeded PRNG using the Mulberry32 algorithm.
 * Guarantees 100% deterministic packet sequences for Daily Challenges and tests.
 */
export class SeededRandom {
  private state: number;

  constructor(seedStringOrNumber: string | number) {
    if (typeof seedStringOrNumber === "number") {
      this.state = seedStringOrNumber >>> 0;
    } else {
      let hash = 0;
      for (let i = 0; i < seedStringOrNumber.length; i++) {
        hash = (Math.imul(31, hash) + seedStringOrNumber.charCodeAt(i)) | 0;
      }
      this.state = hash >>> 0;
    }
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  pick<T>(array: readonly T[]): T {
    const idx = Math.floor(this.next() * array.length);
    return array[idx];
  }
}

/**
 * Comprehensive Word Dictionaries for Terminal Velocity
 * Grouped strictly by difficulty character counts
 */
const EASY_WORDS = [
  "BYTE", "CODE", "DATA", "ECHO", "FLOW", "GRID", "HASH", "NODE",
  "PING", "ROOT", "SYNC", "WIFI", "LINK", "SCAN", "PORT", "BIOS",
  "CORE", "HOST", "LOOP", "NULL", "RAMP", "SAFE", "TASK", "USER",
  "WIRE", "ACID", "BEAM", "CHIP", "DOCK", "FIRE", "GATE", "ICON",
  "JUMP", "LOCK", "MUTE", "PACK", "QUIT", "RACE", "SEND", "TRUE",
  "VIEW", "ZERO", "BASE", "CLIK", "DISK", "EXEC", "FAST", "GEAR",
  "HALT", "INFO", "JAVA", "KEYS", "LOAD", "MODE", "NANO", "OPEN",
  "PAGE", "REST", "SLOT", "TEST", "UNIT", "VOID", "WARP", "ZONE",
  "AUTO", "BOLD", "COLD", "DARK", "EDGE", "FILE", "GLOW", "HIDE"
];

const MEDIUM_WORDS = [
  "CIPHER", "PACKET", "VECTOR", "KERNEL", "BINARY", "ROUTER",
  "SHIELD", "MATRIX", "SIGNAL", "SOCKET", "DAEMON", "PARSER",
  "THREAD", "BUFFER", "STREAM", "SYNTAX", "CRYPTO", "SERVER",
  "ACCESS", "BACKUP", "CLIENT", "DOMAIN", "FILTER", "GLOBAL",
  "HEADER", "MEMORY", "MODULE", "OBJECT", "OUTPUT", "RANDOM",
  "RENDER", "SCRIPT", "SECURE", "SENSOR", "SOURCE", "STATUS",
  "STRING", "SYSTEM", "TUNNEL", "UPLOAD", "VIRTUAL", "WIDGET",
  "WORKER", "ACTION", "BRANCH", "BRIDGE", "BROKER", "BUNDLE",
  "CACHED", "CONFIG", "CONNECT", "CONSOLE", "CURSOR", "DEVICE",
  "DIRECT", "DRIVER", "ENGINE", "ENTROPY", "FORMAT", "HANDLE",
  "IMPORT", "INJECT", "LAYOUT", "LINEAR", "LISTEN", "LOGICAL",
  "LOOKUP", "NATIVE", "NETWORK", "OFFSET", "PACKER", "PREFIX"
];

const HARD_WORDS = [
  "ALGORITHM", "BANDWIDTH", "BITSTREAM", "BLOCKCHAIN", "CORRUPTION",
  "DECRYPTOR", "FIREWALL9", "HYPERTEXT", "INTERFACE", "PROTOCOLS",
  "QUANTUM01", "OVERCLOCK", "SIGNATURE", "TERABYTE3", "ANOMALIES",
  "MAINFRAME", "ENCRYPTION", "SUBROUTINE", "DATACENTER", "VULNERABLE",
  "ASYNCHRONOUS", "MIDDLEWARE", "JAVASCRIPT", "KUBERNETES", "COMPRESSION",
  "SERIALIZER", "CONTROLLER", "REPOSITORY", "PERMISSION", "CONNECTION",
  "AUTHENTIC", "DISTRIBUTED", "TRANSACTION", "DEPENDENCY", "ARCHITECTURE",
  "INVOCATION", "INTEGRATION", "CERTIFICATE", "CRYPTOGRAPHY", "PROBABILITY",
  "BREAKPOINT", "DESTRUCTIVE", "INTERCEPTOR", "REDUNDANCY", "TELEMETRY",
  "VALIDATION", "DELEGATION", "0xDEADBEEF", "0xCAFEBABE", "0xFEEDFACE",
  "SIMULATION", "CONCURRENCY", "PERFORMANCE", "RECOGNITION", "COMPONENTS"
];

/**
 * Probability Engine - Authoritative mathematical calculations
 */
export class ProbabilityEngine {
  static calculateExpectedValue(
    reward: number,
    corruptionProbability: number,
    corruptionPenalty: number,
    interceptionCost = 0
  ): number {
    this.validateProbability(corruptionProbability);
    const p = corruptionProbability;
    const ev = (1 - p) * reward - p * corruptionPenalty - interceptionCost;
    return Number(ev.toFixed(2));
  }

  static validateProbability(p: number): void {
    if (typeof p !== "number" || isNaN(p) || p < 0 || p > 1) {
      throw new Error(`Invalid probability: ${p}. Must be a float between 0 and 1.`);
    }
  }

  static getRiskRating(p: number): "low" | "medium" | "high" | "critical" {
    if (p < 0.20) return "low";
    if (p < 0.45) return "medium";
    if (p < 0.70) return "high";
    return "critical";
  }

  static estimateTypingDuration(codeLength: number, assumedWpm = 60): number {
    const charsPerSec = (assumedWpm * 5) / 60;
    return Math.max(0.5, Number((codeLength / charsPerSec).toFixed(2)));
  }

  static calculateValuePerSecond(ev: number, codeLength: number, assumedWpm = 60): number {
    const duration = this.estimateTypingDuration(codeLength, assumedWpm);
    return Number((ev / duration).toFixed(2));
  }

  static sampleOutcome(
    corruptionProbability: number,
    rng: SeededRandom | { next(): number } = { next: () => Math.random() }
  ): { outcome: "clean" | "corrupted"; roll: number } {
    this.validateProbability(corruptionProbability);
    const roll = rng.next();
    const isCorrupted = roll < corruptionProbability;
    return {
      outcome: isCorrupted ? "corrupted" : "clean",
      roll: Number(roll.toFixed(4)),
    };
  }

  static generatePacket(
    id: string,
    difficulty: Difficulty,
    rng: SeededRandom,
    spawnTimeMs: number,
    laneIndex: number = 0
  ): PacketDefinition {
    const config = {
      easy: {
        words: EASY_WORDS,
        pMin: 0.08,
        pMax: 0.30,
        rewardMin: 50,
        rewardMax: 80,
        penaltyRatioMin: 0.3,
        penaltyRatioMax: 0.5,
        durationSeconds: 11,
        speed: 48,
      },
      medium: {
        words: MEDIUM_WORDS,
        pMin: 0.12,
        pMax: 0.50,
        rewardMin: 90,
        rewardMax: 160,
        penaltyRatioMin: 0.4,
        penaltyRatioMax: 0.7,
        durationSeconds: 8.5,
        speed: 68,
      },
      hard: {
        words: HARD_WORDS,
        pMin: 0.15,
        pMax: 0.65,
        rewardMin: 160,
        rewardMax: 260,
        penaltyRatioMin: 0.5,
        penaltyRatioMax: 0.9,
        durationSeconds: 6.5,
        speed: 92,
      },
    }[difficulty];

    const code = rng.pick(config.words);
    const corruptionProbability = Number(
      rng.nextFloat(config.pMin, config.pMax).toFixed(2)
    );
    const reward = rng.nextInt(config.rewardMin, config.rewardMax);
    const penaltyRatio = rng.nextFloat(config.penaltyRatioMin, config.penaltyRatioMax);
    const corruptionPenalty = Math.round(reward * penaltyRatio);
    const interceptionCost = 0;

    const expectedValue = this.calculateExpectedValue(
      reward,
      corruptionProbability,
      corruptionPenalty,
      interceptionCost
    );

    const riskRating = this.getRiskRating(corruptionProbability);
    const valuePerSecond = this.calculateValuePerSecond(expectedValue, code.length);

    // Add small natural variance (-0.6s to +0.6s) so multiple packets never expire on the exact same millisecond
    const durationVariance = Number(rng.nextFloat(-0.6, 0.6).toFixed(1));
    const packetDuration = Math.max(4.5, Number((config.durationSeconds + durationVariance).toFixed(1)));

    return {
      id,
      code,
      reward,
      corruptionProbability,
      corruptionPenalty,
      interceptionCost,
      expectedValue,
      durationSeconds: packetDuration,
      speed: config.speed,
      riskRating,
      valuePerSecond,
      spawnTimeMs,
      laneIndex,
    };
  }

  static computeCalibrationBins(
    events: PacketEvent[],
    binCount = 5
  ): Array<{
    binLabel: string;
    binMidpoint: number;
    sampleSize: number;
    expectedCorruptionRate: number;
    observedCorruptionRate: number;
  }> {
    const interceptedEvents = events.filter((e) => e.action === "intercepted");
    const bins: Array<{
      min: number;
      max: number;
      label: string;
      events: PacketEvent[];
    }> = [];

    const binSize = 1 / binCount;
    for (let i = 0; i < binCount; i++) {
      const min = i * binSize;
      const max = (i + 1) * binSize;
      bins.push({
        min,
        max,
        label: `${Math.round(min * 100)}% - ${Math.round(max * 100)}%`,
        events: [],
      });
    }

    for (const ev of interceptedEvents) {
      const p = ev.corruptionProbability;
      const bin = bins.find(
        (b, idx) => p >= b.min && (idx === bins.length - 1 ? p <= b.max : p < b.max)
      );
      if (bin) bin.events.push(ev);
    }

    return bins.map((b) => {
      const sampleSize = b.events.length;
      if (sampleSize === 0) {
        return {
          binLabel: b.label,
          binMidpoint: Number(((b.min + b.max) / 2).toFixed(2)),
          sampleSize: 0,
          expectedCorruptionRate: Number(((b.min + b.max) / 2).toFixed(2)),
          observedCorruptionRate: 0,
        };
      }

      const avgExpected =
        b.events.reduce((sum, e) => sum + e.corruptionProbability, 0) / sampleSize;
      const observedCorruptions = b.events.filter(
        (e) => e.outcome === "corrupted"
      ).length;
      const observedRate = observedCorruptions / sampleSize;

      return {
        binLabel: b.label,
        binMidpoint: Number(((b.min + b.max) / 2).toFixed(2)),
        sampleSize,
        expectedCorruptionRate: Number(avgExpected.toFixed(3)),
        observedCorruptionRate: Number(observedRate.toFixed(3)),
      };
    });
  }

  static aggregateRunMetrics(events: PacketEvent[]) {
    const intercepted = events.filter((e) => e.action === "intercepted");
    const cleanPackets = intercepted.filter((e) => e.outcome === "clean");
    const corruptedPackets = intercepted.filter((e) => e.outcome === "corrupted");
    const missedPackets = events.filter((e) => e.action === "missed");
    const ignoredPackets = events.filter((e) => e.action === "ignored");

    const totalExpectedValue = Number(
      intercepted.reduce((sum, e) => sum + e.expectedValue, 0).toFixed(1)
    );
    const totalRealizedScore = intercepted.reduce((sum, e) => sum + e.pointsDelta, 0);

    const grossRewardsEarned = cleanPackets.reduce((sum, e) => sum + e.reward, 0);
    const grossPenaltiesIncurred = corruptedPackets.reduce(
      (sum, e) => sum + e.corruptionPenalty,
      0
    );

    const evDiscrepancy = totalRealizedScore - totalExpectedValue;
    const positiveEvCount = intercepted.filter((e) => e.expectedValue > 0).length;
    const rationalDecisionIndex =
      intercepted.length > 0 ? (positiveEvCount / intercepted.length) * 100 : 100;

    return {
      totalIntercepted: intercepted.length,
      cleanCount: cleanPackets.length,
      corruptedCount: corruptedPackets.length,
      missedCount: missedPackets.length,
      ignoredCount: ignoredPackets.length,
      totalExpectedValue,
      totalRealizedScore,
      grossRewardsEarned,
      grossPenaltiesIncurred,
      evDiscrepancy,
      rationalDecisionIndex: Number(rationalDecisionIndex.toFixed(1)),
      luckIndex:
        totalExpectedValue !== 0
          ? Number(((totalRealizedScore / totalExpectedValue) * 100).toFixed(1))
          : 100,
    };
  }
}
