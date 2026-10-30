import { Difficulty, PacketDefinition, PacketOutcome, PacketEvent, WordPackType } from "@/types";
import { round2 } from "@/lib/utils";

import { SeededRandom } from "./prng";
import { EASY_WORDS, MEDIUM_WORDS, HARD_WORDS, getWordsForPackAndDifficulty } from "./words";

// Re-export for complete backward compatibility
export { SeededRandom, EASY_WORDS, MEDIUM_WORDS, HARD_WORDS, getWordsForPackAndDifficulty };

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
    return round2(ev);
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
    return Math.max(0.5, round2(codeLength / charsPerSec));
  }

  static calculateValuePerSecond(ev: number, codeLength: number, assumedWpm = 60): number {
    const duration = this.estimateTypingDuration(codeLength, assumedWpm);
    return round2(ev / duration);
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
      roll: round2(roll),
    };
  }

  static generatePacket(
    id: string,
    difficulty: Difficulty,
    rng: SeededRandom,
    spawnTimeMs: number,
    laneIndex: number = 0,
    excludeInitials: string[] = [],
    forcedTier?: "safe" | "caution" | "danger",
    excludeWords: string[] = [],
    options?: {
      wordPack?: WordPackType;
      playerLives?: number;
      hasShieldOnScreen?: boolean;
    }
  ): PacketDefinition {
    const rawWords = getWordsForPackAndDifficulty(options?.wordPack || "core", difficulty);

    const config = {
      easy: {
        words: rawWords,
        pMin: 0.10,
        pMax: 0.25,
        durationSeconds: 11,
        speed: 48,
        rewardRange: {
          min: 40,
          max: 70,
          safe: [40, 50],
          caution: [50, 60],
          danger: [60, 70],
        },
      },
      medium: {
        words: rawWords,
        pMin: 0.12,
        pMax: 0.45,
        durationSeconds: 8.5,
        speed: 68,
        rewardRange: {
          min: 75,
          max: 130,
          safe: [75, 90],
          caution: [90, 110],
          danger: [110, 130],
        },
      },
      hard: {
        words: rawWords,
        pMin: 0.15,
        pMax: 0.65,
        durationSeconds: 6.5,
        speed: 92,
        rewardRange: {
          min: 140,
          max: 240,
          safe: [140, 170],
          caution: [170, 205],
          danger: [205, 240],
        },
      },
    }[difficulty];

    // Exclude words that are already on screen or recently spawned to maximize variety
    const upperExcludeWords = new Set(excludeWords.map((w) => w.toUpperCase()));
    let candidatePool = config.words.filter((w) => !upperExcludeWords.has(w.toUpperCase()));
    if (candidatePool.length === 0) {
      // Fallback if recent memory pool is full
      candidatePool = config.words.slice();
    }

    // Exclude starting letters that are already active on screen to prevent first-letter conflicts
    const upperExcludeInitials = excludeInitials.map((c) => c.toUpperCase());
    const availableWords = candidatePool.filter(
      (w) => !upperExcludeInitials.includes(w.charAt(0).toUpperCase())
    );
    const wordsPool = availableWords.length > 0 ? availableWords : candidatePool;
    const code = rng.pick(wordsPool);

    // Special Packet Determination:
    // 1. Nanite Shield Recovery: When player has <= 2 shields and no shield is currently falling
    // 2. Golden High Roller: 6% natural chance for an ultra-rewarding 3x packet with coin-flip p=0.50
    let specialType: "standard" | "shield" | "high_roller" = "standard";
    const canSpawnShield = options?.playerLives !== undefined && options.playerLives <= 2 && !options.hasShieldOnScreen;

    if (canSpawnShield && rng.next() < 0.28) {
      specialType = "shield";
    } else if (rng.next() < 0.06) {
      specialType = "high_roller";
    }

    let corruptionProbability: number;
    let reward: number;

    if (specialType === "shield") {
      // Shield recovery packets are always safe and restore a depleted shield on clean catch
      corruptionProbability = 0.10;
      reward = rng.nextInt(config.rewardRange.safe[0], config.rewardRange.safe[1]);
    } else if (specialType === "high_roller") {
      // Golden High Roller: 50% coin-flip risk, 3x Advertised Reward!
      corruptionProbability = 0.50;
      const baseDangerReward = rng.nextInt(config.rewardRange.danger[0], config.rewardRange.danger[1]);
      reward = baseDangerReward * 3;
    } else if (forcedTier === "safe") {
      corruptionProbability = Number(rng.nextFloat(0.10, 0.20).toFixed(2));
      reward = rng.nextInt(config.rewardRange.safe[0], config.rewardRange.safe[1]);
    } else if (forcedTier === "caution") {
      corruptionProbability = Number(rng.nextFloat(0.25, 0.40).toFixed(2));
      reward = rng.nextInt(config.rewardRange.caution[0], config.rewardRange.caution[1]);
    } else if (forcedTier === "danger") {
      corruptionProbability = Number(rng.nextFloat(0.50, 0.65).toFixed(2));
      reward = rng.nextInt(config.rewardRange.danger[0], config.rewardRange.danger[1]);
    } else {
      // Natural distribution: 55% Safe, 35% Caution, 10% Danger
      const roll = rng.next();
      if (roll < 0.55) {
        corruptionProbability = Number(rng.nextFloat(config.pMin, Math.min(0.22, config.pMax)).toFixed(2));
        reward = rng.nextInt(config.rewardRange.safe[0], config.rewardRange.safe[1]);
      } else if (roll < 0.90) {
        corruptionProbability = Number(rng.nextFloat(0.25, Math.min(0.42, config.pMax)).toFixed(2));
        reward = rng.nextInt(config.rewardRange.caution[0], config.rewardRange.caution[1]);
      } else {
        corruptionProbability = Number(rng.nextFloat(0.50, config.pMax).toFixed(2));
        reward = rng.nextInt(config.rewardRange.danger[0], config.rewardRange.danger[1]);
      }
    }

    // Advertised Reward represents the Pure Typing Score yield for this packet
    // Non-corrupted packets award positive pure score (+reward)
    // Corrupted packets penalize with negative score (-corruptionPenalty)
    const pureTypingScore = reward;
    const corruptionPenalty = reward;

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
    const durationVariance = round2(rng.nextFloat(-0.6, 0.6));
    const packetDuration = Math.max(4.5, round2(config.durationSeconds + durationVariance));
    const packetSpeed = specialType === "shield" ? Math.round(config.speed * 1.25) : config.speed;

    return {
      id,
      code,
      reward,
      corruptionProbability,
      corruptionPenalty,
      interceptionCost,
      expectedValue,
      durationSeconds: packetDuration,
      speed: packetSpeed,
      riskRating,
      valuePerSecond,
      spawnTimeMs,
      laneIndex,
      specialType,
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
          binMidpoint: round2((b.min + b.max) / 2),
          sampleSize: 0,
          expectedCorruptionRate: round2((b.min + b.max) / 2),
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
        binMidpoint: round2((b.min + b.max) / 2),
        sampleSize,
        expectedCorruptionRate: round2(avgExpected),
        observedCorruptionRate: round2(observedRate),
      };
    });
  }

  static aggregateRunMetrics(events: PacketEvent[]) {
    const intercepted = events.filter((e) => e.action === "intercepted");
    const cleanPackets = intercepted.filter((e) => e.outcome === "clean");
    const corruptedPackets = intercepted.filter((e) => e.outcome === "corrupted");
    const missedPackets = events.filter((e) => e.action === "missed");
    const ignoredPackets = events.filter((e) => e.action === "ignored");

    const totalExpectedValue = round2(
      intercepted.reduce((sum, e) => sum + e.expectedValue, 0)
    );
    const totalRealizedScore = round2(
      intercepted.reduce((sum, e) => sum + e.pointsDelta, 0)
    );

    const grossRewardsEarned = round2(cleanPackets.reduce((sum, e) => sum + e.reward, 0));
    const grossPenaltiesIncurred = round2(
      corruptedPackets.reduce(
        (sum, e) => sum + e.corruptionPenalty,
        0
      )
    );

    const evDiscrepancy = round2(totalRealizedScore - totalExpectedValue);
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
      rationalDecisionIndex: round2(rationalDecisionIndex),
      luckIndex:
        totalExpectedValue !== 0
          ? round2((totalRealizedScore / totalExpectedValue) * 100)
          : 100,
    };
  }
}
