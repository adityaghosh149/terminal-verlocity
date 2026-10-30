import { describe, it, expect } from "vitest";
import { round2, formatNumber, formatPercent } from "@/lib/utils";
import { ProbabilityEngine } from "@/lib/probability/engine";
import { PacketEvent } from "@/types";

describe("Round off up to 2 decimal places invariant", () => {
  it("round2 accurately rounds numbers to at most 2 decimal places", () => {
    expect(round2(12.3456)).toBe(12.35);
    expect(round2(12.3444)).toBe(12.34);
    expect(round2(12)).toBe(12);
    expect(round2(0.1 + 0.2)).toBe(0.3); // Floating-point precision fix
    expect(round2(null)).toBe(0);
    expect(round2(undefined)).toBe(0);
    expect(round2(NaN)).toBe(0);
  });

  it("formatNumber formats up to 2 decimal places", () => {
    expect(formatNumber(1234.567)).toBe("1,234.57");
    expect(formatNumber(1234.5)).toBe("1,234.5");
    expect(formatNumber(1234)).toBe("1,234");
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(null)).toBe("0");
  });

  it("formatPercent formats percentages up to 2 decimal places", () => {
    expect(formatPercent(0.9525)).toBe("95.25%");
    expect(formatPercent(0.5)).toBe("50%");
    expect(formatPercent(1)).toBe("100%");
  });

  it("ProbabilityEngine calculations produce numbers with at most 2 decimal places", () => {
    const ev = ProbabilityEngine.calculateExpectedValue(100, 0.333333, 50, 0);
    expect(ev).toBe(50.0);
    expect(String(ev).split(".")[1]?.length || 0).toBeLessThanOrEqual(2);

    const vps = ProbabilityEngine.calculateValuePerSecond(77.777, 5, 60);
    expect(String(vps).split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
  });

  it("aggregateRunMetrics outputs metrics with at most 2 decimal places", () => {
    const events: PacketEvent[] = [
      {
        packetId: "pkt_1",
        code: "ALPHA",
        reward: 95.333,
        corruptionProbability: 0.17,
        corruptionPenalty: 43.123,
        expectedValue: 71.79,
        action: "intercepted",
        outcome: "clean",
        timestampMs: 1200,
        pointsDelta: 95.33,
        wpm: 68.45,
        accuracy: 98.2,
      },
      {
        packetId: "pkt_2",
        code: "BETA",
        reward: 120,
        corruptionProbability: 0.42,
        corruptionPenalty: 60,
        expectedValue: 44.4,
        action: "intercepted",
        outcome: "corrupted",
        timestampMs: 2500,
        pointsDelta: -60,
        wpm: 62.11,
        accuracy: 94.5,
      },
    ];

    const metrics = ProbabilityEngine.aggregateRunMetrics(events);
    expect(String(metrics.totalExpectedValue).split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    expect(String(metrics.totalRealizedScore).split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    expect(String(metrics.evDiscrepancy).split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    expect(String(metrics.rationalDecisionIndex).split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    expect(String(metrics.luckIndex).split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
  });

  it("computeCalibrationBins outputs bin rates with at most 2 decimal places", () => {
    const events: PacketEvent[] = [
      {
        packetId: "pkt_1",
        code: "ALPHA",
        reward: 100,
        corruptionProbability: 0.166666,
        corruptionPenalty: 50,
        expectedValue: 75,
        action: "intercepted",
        outcome: "clean",
        timestampMs: 1200,
        pointsDelta: 100,
        wpm: 68,
        accuracy: 100,
      },
    ];

    const bins = ProbabilityEngine.computeCalibrationBins(events, 5);
    for (const b of bins) {
      expect(String(b.expectedCorruptionRate).split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
      expect(String(b.observedCorruptionRate).split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
      expect(String(b.binMidpoint).split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    }
  });
});
