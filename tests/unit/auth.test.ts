import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth/password";
import { signAccessToken, verifyAccessToken } from "@/lib/auth/jwt";
import { generateRefreshToken, hashToken, timingSafeEqual } from "@/lib/auth/tokens";
import { generateNumericOtp, generateResetToken } from "@/lib/auth/otp";

describe("Custom Authentication Cryptography & Protocols", () => {
  it("hashes and verifies passwords correctly using Argon2id", async () => {
    const raw = "SuperSecretPassword123!";
    const hash = await hashPassword(raw);

    expect(hash).toBeDefined();
    expect(hash).toContain("$argon2id$");

    // Correct password must verify
    const isValid = await verifyPassword(hash, raw);
    expect(isValid).toBe(true);

    // Incorrect password must fail
    const isWrong = await verifyPassword(hash, "WrongPassword123!");
    expect(isWrong).toBe(false);
  });

  it("enforces strong password complexity validation", () => {
    expect(validatePasswordStrength("short").valid).toBe(false);
    expect(validatePasswordStrength("nouppercase123").valid).toBe(false);
    expect(validatePasswordStrength("NOLOWERCASE123").valid).toBe(false);
    expect(validatePasswordStrength("NoNumbersHere!").valid).toBe(false);
    expect(validatePasswordStrength("ValidPassword123").valid).toBe(true);
  });

  it("signs and verifies short-lived JWT access tokens using jose", async () => {
    const payload = {
      userId: "usr_mock123",
      email: "test@domain.com",
      username: "testoperator",
      isVerified: true,
    };

    const token = await signAccessToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = await verifyAccessToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.username).toBe(payload.username);
    expect(decoded?.isVerified).toBe(true);
  });

  it("rejects tampered or forged JWT access tokens", async () => {
    const payload = {
      userId: "usr_mock123",
      email: "test@domain.com",
      username: "testoperator",
      isVerified: true,
    };

    const token = await signAccessToken(payload);
    const tampered = token.slice(0, -6) + "abcdef";
    const decoded = await verifyAccessToken(tampered);
    expect(decoded).toBeNull();
  });

  it("generates cryptographically secure refresh tokens and SHA-256 hashes", () => {
    const ref1 = generateRefreshToken();
    const ref2 = generateRefreshToken();

    expect(ref1.plainToken.length).toBe(80); // 40 bytes = 80 hex characters
    expect(ref1.tokenHash).toBe(hashToken(ref1.plainToken));
    expect(ref1.plainToken).not.toBe(ref2.plainToken);
    expect(ref1.familyId).toBeDefined();
  });

  it("performs timing-safe string comparison", () => {
    expect(timingSafeEqual("abc123456", "abc123456")).toBe(true);
    expect(timingSafeEqual("abc123456", "abc123457")).toBe(false);
    expect(timingSafeEqual("short", "longerstring")).toBe(false);
  });

  it("generates 6-digit numeric OTPs and reset tokens with expiration", () => {
    const otp = generateNumericOtp("EMAIL_VERIFICATION", 10);
    expect(otp.code.length).toBe(6);
    expect(/^\d{6}$/.test(otp.code)).toBe(true);
    expect(otp.codeHash).toBe(hashToken(otp.code));
    expect(otp.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(otp.maxAttempts).toBe(5);

    const reset = generateResetToken(15);
    expect(reset.code.length).toBe(64); // 32 bytes hex
    expect(reset.purpose).toBe("PASSWORD_RESET");
    expect(reset.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
