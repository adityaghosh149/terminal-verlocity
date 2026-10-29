import { Difficulty, PacketDefinition, PacketOutcome, PacketEvent } from "@/types";

import { SeededRandom } from "./prng";
import { EASY_WORDS, MEDIUM_WORDS, HARD_WORDS } from "./words";

// Re-export for complete backward compatibility
export { SeededRandom, EASY_WORDS, MEDIUM_WORDS, HARD_WORDS };

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
    laneIndex: number = 0,
    excludeInitials: string[] = [],
    forcedTier?: "safe" | "caution" | "danger"
  ): PacketDefinition {
    const config = {
      easy: {
        words: EASY_WORDS,
        pMin: 0.10,
        pMax: 0.25,
        rewardMin: 50,
        rewardMax: 80,
        penaltyRatioMin: 0.3,
        penaltyRatioMax: 0.45,
        durationSeconds: 11,
        speed: 48,
      },
      medium: {
        words: MEDIUM_WORDS,
        pMin: 0.12,
        pMax: 0.45,
        rewardMin: 90,
        rewardMax: 160,
        penaltyRatioMin: 0.4,
        penaltyRatioMax: 0.65,
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
        penaltyRatioMax: 0.85,
        durationSeconds: 6.5,
        speed: 92,
      },
    }[difficulty];

    // Exclude starting letters that are already active on screen to prevent first-letter conflicts
    const upperExclude = excludeInitials.map((c) => c.toUpperCase());
    const availableWords = config.words.filter(
      (w) => !upperExclude.includes(w.charAt(0).toUpperCase())
    );
    const wordsPool = availableWords.length > 0 ? availableWords : config.words;
    const code = rng.pick(wordsPool);

    let corruptionProbability: number;
    let reward: number;
    let corruptionPenalty: number;

    if (forcedTier === "safe") {
      corruptionProbability = Number(rng.nextFloat(0.10, 0.20).toFixed(2));
      reward = rng.nextInt(config.rewardMin, Math.round(config.rewardMin + (config.rewardMax - config.rewardMin) * 0.35));
      corruptionPenalty = Math.round(reward * 0.35);
    } else if (forcedTier === "caution") {
      corruptionProbability = Number(rng.nextFloat(0.25, 0.40).toFixed(2));
      reward = rng.nextInt(Math.round(config.rewardMin + (config.rewardMax - config.rewardMin) * 0.35), Math.round(config.rewardMin + (config.rewardMax - config.rewardMin) * 0.75));
      corruptionPenalty = Math.round(reward * 0.50);
    } else if (forcedTier === "danger") {
      corruptionProbability = Number(rng.nextFloat(0.50, 0.65).toFixed(2));
      reward = rng.nextInt(Math.round(config.rewardMin + (config.rewardMax - config.rewardMin) * 0.75), config.rewardMax);
      corruptionPenalty = Math.round(reward * 0.70);
    } else {
      // Natural distribution: 55% Safe, 35% Caution, 10% Danger
      const roll = rng.next();
      if (roll < 0.55) {
        corruptionProbability = Number(rng.nextFloat(config.pMin, Math.min(0.22, config.pMax)).toFixed(2));
        reward = rng.nextInt(config.rewardMin, Math.round(config.rewardMin + (config.rewardMax - config.rewardMin) * 0.35));
      } else if (roll < 0.90) {
        corruptionProbability = Number(rng.nextFloat(0.25, Math.min(0.42, config.pMax)).toFixed(2));
        reward = rng.nextInt(Math.round(config.rewardMin + (config.rewardMax - config.rewardMin) * 0.35), Math.round(config.rewardMin + (config.rewardMax - config.rewardMin) * 0.75));
      } else {
        corruptionProbability = Number(rng.nextFloat(0.50, config.pMax).toFixed(2));
        reward = rng.nextInt(Math.round(config.rewardMin + (config.rewardMax - config.rewardMin) * 0.75), config.rewardMax);
      }
      const penaltyRatio = rng.nextFloat(config.penaltyRatioMin, config.penaltyRatioMax);
      corruptionPenalty = Math.round(reward * penaltyRatio);
    }

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
