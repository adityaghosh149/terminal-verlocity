import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET_STRING =
  process.env.JWT_ACCESS_SECRET || "terminal_velocity_fallback_access_token_secret_min_32_chars";
const JWT_ISSUER = process.env.JWT_ISSUER || "terminal-velocity.app";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "terminal-velocity-players";

// Convert string secret to Uint8Array for jose
const getSigningKey = () => new TextEncoder().encode(JWT_SECRET_STRING);

export interface AccessTokenPayload {
  userId: string;
  email: string;
  username: string;
  isVerified: boolean;
}

/**
 * Sign a short-lived Access Token (15 minutes expiration)
 */
export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  const secret = getSigningKey();
  const jti = crypto.randomUUID();

  return await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
    isVerified: payload.isVerified,
    tokenType: "access_token",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime("15m") // 15 minutes
    .setJti(jti)
    .sign(secret);
}

/**
 * Verify and decode an Access Token
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const secret = getSigningKey();
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (payload.tokenType !== "access_token") {
      console.warn("Invalid token type presented:", payload.tokenType);
      return null;
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      username: payload.username as string,
      isVerified: Boolean(payload.isVerified),
    };
  } catch (err) {
    // Expired or invalid signature
    return null;
  }
}
