import crypto from "crypto";
import { hashToken } from "./tokens";

export type ChallengePurpose = "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "LOGIN_OTP";

export interface GeneratedChallenge {
  code: string;         // Plaintext to send via email
  codeHash: string;     // Stored in MongoDB
  expiresAt: Date;
  maxAttempts: number;
  purpose: ChallengePurpose;
}

/**
 * Generate a 6-digit cryptographically secure OTP
 */
export function generateNumericOtp(
  purpose: ChallengePurpose = "EMAIL_VERIFICATION",
  validityMinutes = 10
): GeneratedChallenge {
  // Generates integer between 100000 and 999999 inclusive
  const num = crypto.randomInt(100000, 1000000);
  const code = num.toString();
  const codeHash = hashToken(code);
  const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

  return {
    code,
    codeHash,
    expiresAt,
    maxAttempts: 5,
    purpose,
  };
}

/**
 * Generate a high-entropy alphanumeric reset token (e.g. for reset password links)
 */
export function generateResetToken(validityMinutes = 15): GeneratedChallenge {
  const code = crypto.randomBytes(32).toString("hex");
  const codeHash = hashToken(code);
  const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

  return {
    code,
    codeHash,
    expiresAt,
    maxAttempts: 3,
    purpose: "PASSWORD_RESET",
  };
}
