import crypto from "crypto";

export interface RefreshTokenGeneration {
  plainToken: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
}

/**
 * Hash any high-entropy token or code with SHA-256 for secure DB storage
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Generate a cryptographically secure refresh token
 */
export function generateRefreshToken(existingFamilyId?: string): RefreshTokenGeneration {
  // 40 random bytes = 80 hex characters
  const plainToken = crypto.randomBytes(40).toString("hex");
  const tokenHash = hashToken(plainToken);
  const familyId = existingFamilyId || crypto.randomUUID();
  // 30 days expiration
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return {
    plainToken,
    tokenHash,
    familyId,
    expiresAt,
  };
}

/**
 * Constant-time string equality check to mitigate timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
