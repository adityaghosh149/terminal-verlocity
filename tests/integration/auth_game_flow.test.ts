import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signAccessToken, verifyAccessToken } from "@/lib/auth/jwt";
import { generateRefreshToken, hashToken } from "@/lib/auth/tokens";
import { generateNumericOtp } from "@/lib/auth/otp";
import { ProbabilityEngine } from "@/lib/probability/engine";
import { PacketEvent } from "@/types";

describe("Terminal Velocity End-to-End Cryptographic & Game Logic Flows", () => {
  it("executes the complete authentication lifecycle from registration to verification", async () => {
    // 1. Password hashing with Argon2id
    const plainPassword = "TerminalVelocity2026!";
    const passwordHash = await hashPassword(plainPassword);
    expect(await verifyPassword(passwordHash, plainPassword)).toBe(true);

    // 2. OTP generation
    const challenge = generateNumericOtp("EMAIL_VERIFICATION", 10);
    expect(challenge.code.length).toBe(6);
    expect(hashToken(challenge.code)).toBe(challenge.codeHash);

    // 3. Session and token family issuance
    const initialSession = generateRefreshToken();
    expect(initialSession.plainToken.length).toBe(80);

    // 4. Token rotation within same family
    const rotatedSession = generateRefreshToken(initialSession.familyId);
    expect(rotatedSession.familyId).toBe(initialSession.familyId);
    expect(rotatedSession.plainToken).not.toBe(initialSession.plainToken);

    // 5. Access token issuance
    const accessToken = await signAccessToken({
      userId: "usr_operative_01",
      email: "operative@terminal.grid",
      username: "neo_velocity",
      isVerified: true,
    });
    const verifiedPayload = await verifyAccessToken(accessToken);
    expect(verifiedPayload?.username).toBe("neo_velocity");
    expect(verifiedPayload?.isVerified).toBe(true);
  });

  it("verifies packet telemetry tally, EV calculations, and data science aggregation", () => {
    // Simulate 3 packet interceptions
    const events: PacketEvent[] = [
      {
        packetId: "pkt_1",
        code: "CIPHER",
        reward: 120,
        corruptionProbability: 0.2,
        corruptionPenalty: 60,
        expectedValue: 84, // (1 - 0.2)*120 - 0.2*60 = 96 - 12 = 84
        action: "intercepted",
        outcome: "clean",
        timestampMs: 5000,
        pointsDelta: 120,
        wpm: 65,
        accuracy: 100,
      },
      {
        packetId: "pkt_2",
        code: "VECTOR",
        reward: 150,
        corruptionProbability: 0.3,
        corruptionPenalty: 90,
        expectedValue: 78, // (1 - 0.3)*150 - 0.3*90 = 105 - 27 = 78
        action: "intercepted",
        outcome: "corrupted",
        timestampMs: 12000,
        pointsDelta: -90,
        wpm: 70,
        accuracy: 95,
      },
      {
        packetId: "pkt_3",
        code: "KERNEL",
        reward: 100,
        corruptionProbability: 0.1,
        corruptionPenalty: 40,
        expectedValue: 86, // (1 - 0.1)*100 - 0.1*40 = 90 - 4 = 86
        action: "intercepted",
        outcome: "clean",
        timestampMs: 20000,
        pointsDelta: 100,
        wpm: 60,
        accuracy: 100,
      },
    ];

    const metrics = ProbabilityEngine.aggregateRunMetrics(events);
    expect(metrics.totalIntercepted).toBe(3);
    expect(metrics.cleanCount).toBe(2);
    expect(metrics.corruptedCount).toBe(1);
    expect(metrics.totalRealizedScore).toBe(120 - 90 + 100); // 130
    expect(metrics.totalExpectedValue).toBe(84 + 78 + 86); // 248
    expect(metrics.rationalDecisionIndex).toBe(100); // All 3 had positive EV!
  });
});
