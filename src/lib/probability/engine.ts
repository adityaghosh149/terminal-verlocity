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

  /**
   * Returns a pseudo-random floating point number in [0, 1)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer in [min, max] inclusive
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a random float in [min, max)
   */
  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Pick random element from an array
   */
  pick<T>(array: readonly T[]): T {
    const idx = Math.floor(this.next() * array.length);
    return array[idx];
  }
}

/**
 * Probability Engine - Authoritative mathematical calculations
 */
export class ProbabilityEngine {
  /**
   * Authoritative Expected Value calculation:
   * EV = (1 - p)*R - p*C - K
   */
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

  /**
   * Validate probability is strictly bounded in [0, 1]
   */
  static validateProbability(p: number): void {
    if (typeof p !== "number" || isNaN(p) || p < 0 || p > 1) {
      throw new Error(`Invalid probability: ${p}. Must be a float between 0 and 1.`);
    }
  }

  /**
   * Determine risk tier based on corruption probability
   */
  static getRiskRating(p: number): "low" | "medium" | "high" | "critical" {
    if (p < 0.20) return "low";
    if (p < 0.45) return "medium";
    if (p < 0.70) return "high";
    return "critical";
  }

  /**
   * Estimate typing duration based on character length and average speed (60 WPM = 5 chars/sec)
   */
  static estimateTypingDuration(codeLength: number, assumedWpm = 60): number {
    const charsPerSec = (assumedWpm * 5) / 60;
    return Math.max(0.5, Number((codeLength / charsPerSec).toFixed(2)));
  }

  /**
   * Calculate Expected Value Per Second (VPS)
   */
  static calculateValuePerSecond(ev: number, codeLength: number, assumedWpm = 60): number {
    const duration = this.estimateTypingDuration(codeLength, assumedWpm);
    return Number((ev / duration).toFixed(2));
  }

  /**
   * Authoritative Packet Outcome Sampling:
   * Clean with probability (1 - p), Corrupted with probability p.
   * Outcome is ONLY sampled when interception occurs.
   */
  static sampleOutcome(
    corruptionProbability: number,
    rng: SeededRandom | { next(): number } = { next: () => Math.random() }
  ): { outcome: "clean" | "corrupted"; roll: number } {
    this.validateProbability(corruptionProbability);
    const roll = rng.next();
    // If roll is strictly less than corruptionProbability, it is corrupted
    const isCorrupted = roll < corruptionProbability;
    return {
      outcome: isCorrupted ? "corrupted" : "clean",
      roll: Number(roll.toFixed(4)),
    };
  }

  /**
   * Generate a packet definition adhering to difficulty profile
   */
  static generatePacket(
    id: string,
    difficulty: Difficulty,
    rng: SeededRandom,
    spawnTimeMs: number,
    laneIndex: number = 0
  ): PacketDefinition {
    // Difficulty profiles
    const config = {
      easy: {
        words: [
          "BYTE", "CODE", "DATA", "ECHO", "FLOW", "GRID", "HASH", "NODE",
          "PING", "ROOT", "SYNC", "WIFI", "LINK", "SCAN", "PORT", "BIOS"
        ],
        pMin: 0.05,
        pMax: 0.40,
        rewardMin: 50,
        rewardMax: 120,
        penaltyRatioMin: 0.3,
        penaltyRatioMax: 0.6,
        durationSeconds: 11,
        speed: 48,
      },
      medium: {
        words: [
          "CIPHER", "PACKET", "VECTOR", "KERNEL", "BINARY", "ROUTER",
          "SHIELD", "MATRIX", "SIGNAL", "SOCKET", "DAEMON", "PARSER",
          "THREAD", "BUFFER", "STREAM", "SYNTAX", "CRYPTO", "SERVER"
        ],
        pMin: 0.10,
        pMax: 0.65,
        rewardMin: 100,
        rewardMax: 240,
        penaltyRatioMin: 0.5,
        penaltyRatioMax: 0.9,
        durationSeconds: 8.5,
        speed: 68,
      },
      hard: {
        words: [
          "0xDEADBEEF", "ALGORITHM", "BANDWIDTH", "BITSTREAM", "CORRUPTION",
          "DECRYPTOR", "FIREWALL9", "HYPERTEXT", "INTERFACE", "PROTOCOLS",
          "QUANTUM01", "OVERCLOCK", "SIGNATURE", "TERABYTE3", "ANOMALY99"
        ],
        pMin: 0.15,
        pMax: 0.85,
        rewardMin: 180,
        rewardMax: 450,
        penaltyRatioMin: 0.7,
        penaltyRatioMax: 1.4,
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

    return {
      id,
      code,
      reward,
      corruptionProbability,
      corruptionPenalty,
      interceptionCost,
      expectedValue,
      durationSeconds: config.durationSeconds,
      speed: config.speed,
      riskRating,
      valuePerSecond,
      spawnTimeMs,
      laneIndex,
    };
  }

  /**
   * Binned calibration analysis for Data Science charts.
   * Compares theoretical corruption probability against empirical realized corruption rate.
   */
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

  /**
   * Aggregate comprehensive Data Science metrics from a run
   */
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

    // Variance between actual result and expected value
    const evDiscrepancy = totalRealizedScore - totalExpectedValue;

    // Decision Quality: Percentage of intercepted packets that had positive EV
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
