import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Session } from "@/models/Session";
import { hashToken } from "@/lib/auth/tokens";
import { clearAuthCookies, REFRESH_COOKIE_NAME } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const rawRefreshToken =
      req.cookies.get(REFRESH_COOKIE_NAME)?.value ||
      cookieStore.get(REFRESH_COOKIE_NAME)?.value;

    if (rawRefreshToken) {
      await connectToDatabase();
      const tokenHash = hashToken(rawRefreshToken);
      await Session.findOneAndUpdate({ sessionTokenHash: tokenHash }, { isRevoked: true });
    }

    clearAuthCookies(cookieStore);

    return NextResponse.json({
      success: true,
      message: "Successfully signed out. Session revoked.",
    });
  } catch (err) {
    console.error("Logout error:", err);
    // Still clear cookies even if DB fails
    const cookieStore = cookies();
    clearAuthCookies(cookieStore);
    return NextResponse.json({ success: true, message: "Logged out." });
  }
}
