import { describe, it, expect } from "vitest";
import * as argon2 from "@node-rs/argon2";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/auth/jwt";

describe("JWT Access & Refresh Token Authentication Suite", () => {
  const testUser = {
    userId: "usr_test_123456",
    username: "CIPHER_PILOT",
    name: "Cipher Pilot",
  };

  it("signs and verifies access tokens (15m validity)", async () => {
    const token = await signAccessToken(testUser);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const payload = await verifyAccessToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(testUser.userId);
    expect(payload?.username).toBe(testUser.username);
    expect(payload?.name).toBe(testUser.name);
    expect(payload?.tokenType).toBe("access");
  });

  it("signs and verifies refresh tokens (30d persistent validity)", async () => {
    const token = await signRefreshToken({
      userId: testUser.userId,
      username: testUser.username,
    });
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const payload = await verifyRefreshToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(testUser.userId);
    expect(payload?.username).toBe(testUser.username);
    expect(payload?.tokenType).toBe("refresh");
  });

  it("rejects tampered or forged JWT tokens", async () => {
    const validToken = await signAccessToken(testUser);
    const tampered = validToken.slice(0, -6) + "xxxxxx";

    const verified = await verifyAccessToken(tampered);
    expect(verified).toBeNull();
  });

  it("hashes passwords securely with Argon2id and verifies match", async () => {
    const password = "SuperSecretPassword123!";
    const hashed = await argon2.hash(password);

    expect(hashed).toContain("$argon2id$");
    expect(hashed).not.toBe(password);

    const isMatch = await argon2.verify(hashed, password);
    expect(isMatch).toBe(true);

    const isWrong = await argon2.verify(hashed, "WrongPassword");
    expect(isWrong).toBe(false);
  });
});
