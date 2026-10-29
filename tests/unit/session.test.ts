import { describe, it, expect, beforeEach } from "vitest";
import { useSessionStore } from "@/store/useSessionStore";
import { ProbabilityEngine } from "@/lib/probability/engine";
import { PacketEvent } from "@/types";

describe("Ephemeral Session-Only Callsign Architecture", () => {
  beforeEach(() => {
    useSessionStore.getState().clearSession();
  });

  it("initializes without a username (null on fresh browser load)", () => {
    const state = useSessionStore.getState();
    expect(state.username).toBeNull();
  });

  it("sets and sanitizes operative callsign during active session", () => {
    useSessionStore.getState().setUsername("  shadow_runner  ");
    expect(useSessionStore.getState().username).toBe("SHADOW_RUNNER");

    useSessionStore.getState().setUsername("VeryLongCallsignExceedingLimit");
    expect(useSessionStore.getState().username).toBe("VERYLONGCALLSIG"); // Capped at 15 chars
  });

  it("resets callsign when session is cleared or simulated page refresh occurs", () => {
    useSessionStore.getState().setUsername("VALKYRIE");
    expect(useSessionStore.getState().username).toBe("VALKYRIE");

    // Simulating refresh / clearSession
    useSessionStore.getState().clearSession();
    expect(useSessionStore.getState().username).toBeNull();
  });

  it("handles modal open and close states properly", () => {
    expect(useSessionStore.getState().isCallsignModalOpen).toBe(false);

    useSessionStore.getState().openCallsignModal();
    expect(useSessionStore.getState().isCallsignModalOpen).toBe(true);

    useSessionStore.getState().closeCallsignModal();
    expect(useSessionStore.getState().isCallsignModalOpen).toBe(false);
  });

  it("aggregates session game run telemetry without persistent user account dependencies", () => {
    const events: PacketEvent[] = [
      {
        packetId: "pkt_1",
        code: "CIPHER",
        reward: 120,
        corruptionProbability: 0.2,
        corruptionPenalty: 60,
        expectedValue: 84,
        action: "intercepted",
        outcome: "clean",
        timestampMs: 3000,
        pointsDelta: 120,
        wpm: 68,
        accuracy: 100,
      },
      {
        packetId: "pkt_2",
        code: "VECTOR",
        reward: 160,
        corruptionProbability: 0.35,
        corruptionPenalty: 80,
        expectedValue: 76,
        action: "intercepted",
        outcome: "corrupted",
        timestampMs: 7000,
        pointsDelta: -80,
        wpm: 72,
        accuracy: 94,
      },
    ];

    const metrics = ProbabilityEngine.aggregateRunMetrics(events);
    expect(metrics.totalIntercepted).toBe(2);
    expect(metrics.cleanCount).toBe(1);
    expect(metrics.corruptedCount).toBe(1);
    expect(metrics.totalRealizedScore).toBe(40);
    expect(metrics.totalExpectedValue).toBe(160);
  });
});
