import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";

interface RateLimitDoc {
  key: string;
  points: number;
  expiresAt: Date;
}

const RateLimitSchema = new mongoose.Schema<RateLimitDoc>({
  key: { type: String, required: true, unique: true },
  points: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 }, // MongoDB TTL auto-cleanup!
});

// Avoid re-compilation in development
const RateLimitModel =
  mongoose.models.RateLimit || mongoose.model<RateLimitDoc>("RateLimit", RateLimitSchema);

// In-memory fallback if database connection is temporarily pending
const inMemoryCache = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * Distributed rate limiter designed for Vercel serverless functions.
 * Uses atomic upsert in MongoDB with TTL auto-expiration.
 */
export async function checkRateLimit(
  key: string,
  maxPoints: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetAt = new Date(now + windowSeconds * 1000);

  try {
    const db = await connectToDatabase();
    if (db) {
      // Atomic find and update or insert
      const record = await RateLimitModel.findOneAndUpdate(
        { key },
        {
          $inc: { points: 1 },
          $setOnInsert: { expiresAt: resetAt },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const count = record.points || 1;
      const remaining = Math.max(0, maxPoints - count);
      const isAllowed = count <= maxPoints;
      const resetSeconds = Math.max(
        1,
        Math.ceil((record.expiresAt.getTime() - now) / 1000)
      );

      return {
        success: isAllowed,
        remaining,
        resetSeconds,
      };
    }
  } catch (err) {
    // If DB is unreachable, use local in-memory fallback to avoid blocking valid users
  }

  // Fallback
  const cached = inMemoryCache.get(key);
  if (!cached || cached.resetAt < now) {
    inMemoryCache.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, remaining: maxPoints - 1, resetSeconds: windowSeconds };
  }

  cached.count += 1;
  const remaining = Math.max(0, maxPoints - cached.count);
  const resetSeconds = Math.max(1, Math.ceil((cached.resetAt - now) / 1000));

  return {
    success: cached.count <= maxPoints,
    remaining,
    resetSeconds,
  };
}
