import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully." });

  // Expire cookies immediately
  response.cookies.set(ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
