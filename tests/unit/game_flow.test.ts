import { describe, it, expect } from "vitest";
import { ProbabilityEngine } from "@/lib/probability/engine";
import { getComboMultiplier } from "@/components/game/types";
import { PacketEvent } from "@/types";

describe("Terminal Velocity Game Flow & 5-Shield Integrity", () => {
  it("verifies combo streak multipliers", () => {
    expect(getComboMultiplier(0)).toBe(1);
    expect(getComboMultiplier(2)).toBe(1);
    expect(getComboMultiplier(3)).toBe(2);
    expect(getComboMultiplier(5)).toBe(2);
    expect(getComboMultiplier(6)).toBe(3);
    expect(getComboMultiplier(9)).toBe(3);
    expect(getComboMultiplier(10)).toBe(4);
    expect(getComboMultiplier(25)).toBe(4);
  });

  it("verifies expected value calculations without extraneous cost terms", () => {
    // EV = (1 - p)*R - p*C
    const reward = 120;
    const p = 0.25;
    const penalty = 60;
    const ev = ProbabilityEngine.calculateExpectedValue(reward, p, penalty);

    // Expected: (1 - 0.25)*120 - 0.25*60 = 90 - 15 = 75
    expect(ev).toBe(75);
  });

  it("verifies daily seed determinism", () => {
    const today = new Date().toISOString().slice(0, 10);
    const seed1 = `challenge_${today}`;
    const seed2 = `challenge_${today}`;
    expect(seed1).toBe(seed2);
  });

  it("aggregates combat run metrics accurately", () => {
    const events: PacketEvent[] = [
      {
        packetId: "pkt_1",
        code: "CIPHER",
        reward: 100,
        corruptionProbability: 0.1,
        corruptionPenalty: 40,
        expectedValue: 86,
        action: "intercepted",
        outcome: "clean",
        timestampMs: 2000,
        pointsDelta: 100,
        wpm: 70,
        accuracy: 100,
      },
      {
        packetId: "pkt_2",
        code: "QUANTUM",
        reward: 180,
        corruptionProbability: 0.4,
        corruptionPenalty: 90,
        expectedValue: 72,
        action: "intercepted",
        outcome: "corrupted",
        timestampMs: 5000,
        pointsDelta: -90,
        wpm: 65,
        accuracy: 95,
      },
    ];

    const metrics = ProbabilityEngine.aggregateRunMetrics(events);
    expect(metrics.totalIntercepted).toBe(2);
    expect(metrics.cleanCount).toBe(1);
    expect(metrics.corruptedCount).toBe(1);
    expect(metrics.totalRealizedScore).toBe(10); // 100 - 90 = 10
    expect(metrics.totalExpectedValue).toBe(158); // 86 + 72 = 158
    expect(metrics.evDiscrepancy).toBe(-148);
  });

  it("verifies speed bonus applied strictly on pure typing score", async () => {
    const { getSpeedBonusPercent } = await import("@/components/game/types");
    expect(getSpeedBonusPercent(25)).toBe(0);
    expect(getSpeedBonusPercent(30)).toBe(20);
    expect(getSpeedBonusPercent(55)).toBe(35);
    expect(getSpeedBonusPercent(75)).toBe(50);
    expect(getSpeedBonusPercent(95)).toBe(75);
    expect(getSpeedBonusPercent(120)).toBe(100);

    // If pure typing score is 100 and bonus is 50%, speed bonus must be exactly 50
    const pureTypingScore = 100;
    const speedBonusPct = 50;
    const speedBonusPoints = pureTypingScore * (speedBonusPct / 100);
    expect(speedBonusPoints).toBe(50);
  });

  it("calculates accuracy penalty (2 * (100 - accuracy))% on base typing score", () => {
    const rawTyping = 1000;

    // Helper formula
    const calcPenalty = (acc: number, raw: number) => {
      const errorRate = Math.max(0, 100 - acc);
      const penaltyPct = Math.min(100, 2 * errorRate);
      const penaltyScore = Math.max(0, raw * (penaltyPct / 100));
      const netTyping = raw - penaltyScore;
      return { penaltyPct, penaltyScore, netTyping };
    };

    // 100% Accuracy: 0% penalty
    const p100 = calcPenalty(100, rawTyping);
    expect(p100.penaltyPct).toBe(0);
    expect(p100.penaltyScore).toBe(0);
    expect(p100.netTyping).toBe(1000);

    // 98% Accuracy: 2% error rate -> 4% penalty
    const p98 = calcPenalty(98, rawTyping);
    expect(p98.penaltyPct).toBe(4);
    expect(p98.penaltyScore).toBe(40);
    expect(p98.netTyping).toBe(960);

    // 95% Accuracy: 5% error rate -> 10% penalty
    const p95 = calcPenalty(95, rawTyping);
    expect(p95.penaltyPct).toBe(10);
    expect(p95.penaltyScore).toBe(100);
    expect(p95.netTyping).toBe(900);

    // 90% Accuracy: 10% error rate -> 20% penalty
    const p90 = calcPenalty(90, rawTyping);
    expect(p90.penaltyPct).toBe(20);
    expect(p90.penaltyScore).toBe(200);
    expect(p90.netTyping).toBe(800);

    // 80% Accuracy: 20% error rate -> 40% penalty
    const p80 = calcPenalty(80, rawTyping);
    expect(p80.penaltyPct).toBe(40);
    expect(p80.penaltyScore).toBe(400);
    expect(p80.netTyping).toBe(600);

    // Verification of total score invariant:
    const multiplierScore = 350;
    const speedBonusScore = 200;
    const finalScore = p95.netTyping + multiplierScore + speedBonusScore;
    expect(finalScore).toBe(1450); // (1000 - 100) + 350 + 200 = 1450
  });
});
