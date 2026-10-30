import { SignJWT, jwtVerify } from "jose";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "fallback_access_jwt_secret_min_32_chars_long";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback_refresh_jwt_secret_min_32_chars_long";
const ISSUER = process.env.JWT_ISSUER || "terminal-velocity.app";
const AUDIENCE = process.env.JWT_AUDIENCE || "terminal-velocity-players";
export const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
export const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "30d";

export function parseDurationToSeconds(duration: string, defaultSeconds: number): number {
  if (!duration) return defaultSeconds;
  const match = String(duration).trim().match(/^(\d+)\s*([smhd])$/i);
  if (!match) return defaultSeconds;
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit === "s") return val;
  if (unit === "m") return val * 60;
  if (unit === "h") return val * 3600;
  if (unit === "d") return val * 86400;
  return defaultSeconds;
}

const getAccessKey = () => new TextEncoder().encode(ACCESS_SECRET);
const getRefreshKey = () => new TextEncoder().encode(REFRESH_SECRET);

export const ACCESS_COOKIE_NAME = "tv_access_token";
export const REFRESH_COOKIE_NAME = "tv_refresh_token";

export interface TokenPayload {
  userId: string;
  username: string;
  name?: string;
  tokenType?: "access" | "refresh";
}

/**
 * Sign a short-lived access token (15 minutes).
 */
export async function signAccessToken(payload: {
  userId: string;
  username: string;
  name: string;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    username: payload.username,
    name: payload.name,
    tokenType: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(ACCESS_EXPIRY)
    .sign(getAccessKey());
}

/**
 * Sign a long-lived refresh token (30 days) to prevent user from being logged out.
 */
export async function signRefreshToken(payload: {
  userId: string;
  username: string;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    username: payload.username,
    tokenType: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(getRefreshKey());
}

/**
 * Verify access token. Returns payload or null if invalid/expired.
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verify refresh token. Returns payload or null if invalid/expired.
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Standard secure cookie options for token storage.
 */
export const cookieOptions = {
  access: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: parseDurationToSeconds(ACCESS_EXPIRY, 15 * 60), // defaults to 15 minutes
  },
  refresh: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: parseDurationToSeconds(REFRESH_EXPIRY, 30 * 24 * 60 * 60), // defaults to 30 days
  },
};
