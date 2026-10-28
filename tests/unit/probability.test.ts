import { describe, it, expect } from "vitest";
import { ProbabilityEngine, SeededRandom } from "@/lib/probability/engine";
import { PacketEvent } from "@/types";

describe("ProbabilityEngine", () => {
  it("calculates Expected Value strictly according to the formula EV = (1-p)*R - p*C - K", () => {
    // Example from Master Spec: R = 100, p = 0.20, C = 60, K = 0
    // EV = 0.8 * 100 - 0.2 * 60 = 80 - 12 = 68
    const ev1 = ProbabilityEngine.calculateExpectedValue(100, 0.2, 60, 0);
    expect(ev1).toBe(68);

    // Negative EV scenario: R = 50, p = 0.70, C = 100
    // EV = 0.3 * 50 - 0.7 * 100 = 15 - 70 = -55
    const ev2 = ProbabilityEngine.calculateExpectedValue(50, 0.7, 100, 0);
    expect(ev2).toBe(-55);

    // Interception cost included: R = 150, p = 0.10, C = 40, K = 15
    // EV = 0.9 * 150 - 0.1 * 40 - 15 = 135 - 4 - 15 = 116
    const ev3 = ProbabilityEngine.calculateExpectedValue(150, 0.1, 40, 15);
    expect(ev3).toBe(116);
  });

  it("throws an error for invalid probabilities outside [0, 1]", () => {
    expect(() => ProbabilityEngine.validateProbability(-0.01)).toThrow();
    expect(() => ProbabilityEngine.validateProbability(1.05)).toThrow();
    expect(() => ProbabilityEngine.validateProbability(NaN)).toThrow();
  });

  it("determines risk ratings accurately", () => {
    expect(ProbabilityEngine.getRiskRating(0.1)).toBe("low");
    expect(ProbabilityEngine.getRiskRating(0.3)).toBe("medium");
    expect(ProbabilityEngine.getRiskRating(0.55)).toBe("high");
    expect(ProbabilityEngine.getRiskRating(0.8)).toBe("critical");
  });

  it("produces deterministic random sequences from SeededRandom", () => {
    const seed = "daily-challenge-2026-10-29";
    const rng1 = new SeededRandom(seed);
    const rng2 = new SeededRandom(seed);

    const seq1 = [rng1.next(), rng1.next(), rng1.next(), rng1.nextInt(1, 100)];
    const seq2 = [rng2.next(), rng2.next(), rng2.next(), rng2.nextInt(1, 100)];

    expect(seq1).toEqual(seq2);
  });

  it("samples outcomes matching probability distribution over large sample", () => {
    const p = 0.30;
    const rng = new SeededRandom("monte-carlo-test");
    const samples = 10000;
    let corruptedCount = 0;

    for (let i = 0; i < samples; i++) {
      const { outcome } = ProbabilityEngine.sampleOutcome(p, rng);
      if (outcome === "corrupted") corruptedCount++;
    }

    const observedRate = corruptedCount / samples;
    // Should be close to 0.30 within 2 standard deviations (approx ±0.015)
    expect(observedRate).toBeGreaterThan(0.28);
    expect(observedRate).toBeLessThan(0.32);
  });

  it("computes calibration bins accurately for data science analytics", () => {
    const mockEvents: PacketEvent[] = [
      {
        packetId: "1",
        code: "TEST1",
        reward: 100,
        corruptionProbability: 0.15,
        corruptionPenalty: 50,
        expectedValue: 77.5,
        action: "intercepted",
        outcome: "clean",
        timestampMs: 1000,
        pointsDelta: 100,
        wpm: 65,
        accuracy: 100,
      },
      {
        packetId: "2",
        code: "TEST2",
        reward: 100,
        corruptionProbability: 0.18,
        corruptionPenalty: 50,
        expectedValue: 73,
        action: "intercepted",
        outcome: "corrupted",
        timestampMs: 2000,
        pointsDelta: -50,
        wpm: 70,
        accuracy: 95,
      },
    ];

    const bins = ProbabilityEngine.computeCalibrationBins(mockEvents, 5);
    expect(bins.length).toBe(5);
    // Bin 0 (0% - 20%) should have 2 events
    const bin0 = bins[0];
    expect(bin0.sampleSize).toBe(2);
    expect(bin0.observedCorruptionRate).toBe(0.5); // 1 out of 2 corrupted
  });
});
