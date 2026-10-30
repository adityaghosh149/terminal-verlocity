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

  it("enforces strict difficulty word lengths: 4 in easy, 5 in medium, 6 in hard", async () => {
    const { EASY_WORDS, MEDIUM_WORDS, HARD_WORDS } = await import("@/lib/probability/words");

    expect(EASY_WORDS.length).toBeGreaterThan(200);
    expect(MEDIUM_WORDS.length).toBeGreaterThan(200);
    expect(HARD_WORDS.length).toBeGreaterThan(200);

    // All easy words must be exactly 4 letters
    for (const word of EASY_WORDS) {
      expect(word.length).toBe(4);
      expect(/^[A-Z]+$/.test(word)).toBe(true);
    }

    // All medium words must be exactly 5 letters
    for (const word of MEDIUM_WORDS) {
      expect(word.length).toBe(5);
      expect(/^[A-Z]+$/.test(word)).toBe(true);
    }

    // All hard words must be exactly 6 letters
    for (const word of HARD_WORDS) {
      expect(word.length).toBe(6);
      expect(/^[A-Z]+$/.test(word)).toBe(true);
    }

    // No duplicates in any list
    expect(new Set(EASY_WORDS).size).toBe(EASY_WORDS.length);
    expect(new Set(MEDIUM_WORDS).size).toBe(MEDIUM_WORDS.length);
    expect(new Set(HARD_WORDS).size).toBe(HARD_WORDS.length);
  });

  it("sets advertised reward strictly to pure typing score and penalty to pure typing score", () => {
    const rng = new SeededRandom("test-reward-pure-typing");

    // Easy (4-letter words): reward must be exactly 40
    const easyPkt = ProbabilityEngine.generatePacket("p1", "easy", rng, 1000);
    expect(easyPkt.code.length).toBe(4);
    expect(easyPkt.reward).toBe(40);
    expect(easyPkt.corruptionPenalty).toBe(40);

    // Medium (5-letter words): reward must be exactly 50
    const medPkt = ProbabilityEngine.generatePacket("p2", "medium", rng, 1000);
    expect(medPkt.code.length).toBe(5);
    expect(medPkt.reward).toBe(50);
    expect(medPkt.corruptionPenalty).toBe(50);

    // Hard (6-letter words): reward must be exactly 60
    const hardPkt = ProbabilityEngine.generatePacket("p3", "hard", rng, 1000);
    expect(hardPkt.code.length).toBe(6);
    expect(hardPkt.reward).toBe(60);
    expect(hardPkt.corruptionPenalty).toBe(60);

    // Non-corrupted packet gives positive pure score (+reward)
    // Corrupted packet gives negative pure score (-corruptionPenalty)
    const cleanDelta = easyPkt.reward;
    const corruptedDelta = -easyPkt.corruptionPenalty;
    expect(cleanDelta).toBe(40);
    expect(corruptedDelta).toBe(-40);
  });
});
