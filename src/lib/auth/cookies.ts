import { cookies } from "next/headers";

export const ACCESS_COOKIE_NAME = "tv_access_token";
export const REFRESH_COOKIE_NAME = "tv_refresh_token";

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Set authentication cookies on response
 */
export function setAuthCookies(
  cookieStore: ReturnType<typeof cookies>,
  accessToken: string,
  refreshToken: string
): void {
  // 15-minute access token cookie
  cookieStore.set(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 mins
  });

  // 30-day refresh token cookie
  cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/", // accessible to refresh endpoints
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Clear authentication cookies on logout
 */
export function clearAuthCookies(cookieStore: ReturnType<typeof cookies>): void {
  cookieStore.set(ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  cookieStore.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
