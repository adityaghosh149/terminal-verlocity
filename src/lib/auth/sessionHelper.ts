import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken, AccessTokenPayload } from "./jwt";
import { ACCESS_COOKIE_NAME } from "./cookies";

/**
 * Extract authenticated user session from NextRequest cookies or Authorization header
 */
export async function getSessionUser(
  req?: NextRequest
): Promise<AccessTokenPayload | null> {
  let token: string | undefined;

  // 1. Try reading cookie from NextRequest if passed
  if (req) {
    const cookieToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
    if (cookieToken) {
      token = cookieToken;
    } else {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
  }

  // 2. Try reading from next/headers cookies()
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
    } catch {
      // Outside request context
    }
  }

  if (!token) {
    return null;
  }

  return await verifyAccessToken(token);
}
