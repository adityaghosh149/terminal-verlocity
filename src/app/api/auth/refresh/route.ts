import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Session } from "@/models/Session";
import { User } from "@/models/User";
import { hashToken, generateRefreshToken } from "@/lib/auth/tokens";
import { signAccessToken } from "@/lib/auth/jwt";
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE_NAME } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const rawRefreshToken =
      req.cookies.get(REFRESH_COOKIE_NAME)?.value ||
      cookieStore.get(REFRESH_COOKIE_NAME)?.value;

    if (!rawRefreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided." },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const incomingHash = hashToken(rawRefreshToken);

    // Find the session matching this token hash
    const currentSession = await Session.findOne({ sessionTokenHash: incomingHash });

    if (!currentSession) {
      // Possible token reuse or tampering detected!
      // Invalidate cookies for security
      clearAuthCookies(cookieStore);
      return NextResponse.json(
        { error: "Invalid or expired session. Please sign in again." },
        { status: 401 }
      );
    }

    // Check if session has been explicitly revoked
    if (currentSession.isRevoked) {
      // Breach containment: revoke entire token family
      await Session.updateMany({ familyId: currentSession.familyId }, { isRevoked: true });
      clearAuthCookies(cookieStore);
      return NextResponse.json(
        { error: "Session has been revoked due to detected token reuse. Please sign in again." },
        { status: 401 }
      );
    }

    // Check expiration
    if (new Date() > currentSession.expiresAt) {
      currentSession.isRevoked = true;
      await currentSession.save();
      clearAuthCookies(cookieStore);
      return NextResponse.json(
        { error: "Session has expired. Please log in again." },
        { status: 401 }
      );
    }

    // Lookup User
    const user = await User.findById(currentSession.userId);
    if (!user) {
      clearAuthCookies(cookieStore);
      return NextResponse.json({ error: "User no longer exists." }, { status: 401 });
    }

    // Rotate refresh token: generate new token within the same family
    const nextRefresh = generateRefreshToken(currentSession.familyId);

    currentSession.sessionTokenHash = nextRefresh.tokenHash;
    currentSession.expiresAt = nextRefresh.expiresAt;
    currentSession.lastUsedAt = new Date();
    await currentSession.save();

    // Sign new access token
    const newAccessToken = await signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      isVerified: user.isVerified,
    });

    // Set updated cookies
    setAuthCookies(cookieStore, newAccessToken, nextRefresh.plainToken);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error("Session refresh error:", err);
    return NextResponse.json(
      { error: "Failed to refresh session." },
      { status: 500 }
    );
  }
}
