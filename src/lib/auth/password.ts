import { hash, verify, Options } from "@node-rs/argon2";

/**
 * Argon2id Password Hashing Engine
 * Meets OWASP password storage guidelines:
 * - Argon2id variant
 * - Memory cost: 65536 KiB (64 MiB) or 19456 KiB (19 MiB) for serverless efficiency
 * - Time cost: 2 passes
 * - Parallelism: 1
 */
const ARGON2_OPTIONS: Options = {
  memoryCost: 19456, // 19 MiB for smooth serverless responsiveness
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export async function hashPassword(plainTextPassword: string): Promise<string> {
  if (!plainTextPassword || plainTextPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }
  return await hash(plainTextPassword, ARGON2_OPTIONS);
}

export async function verifyPassword(
  hashString: string,
  plainTextPassword: string
): Promise<boolean> {
  try {
    return await verify(hashString, plainTextPassword, ARGON2_OPTIONS);
  } catch (err) {
    console.error("Password verification error:", err);
    return false;
  }
}

/**
 * Validates password complexity
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number." };
  }
  return { valid: true };
}
