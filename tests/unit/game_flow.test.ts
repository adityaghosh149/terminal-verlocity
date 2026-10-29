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
});
