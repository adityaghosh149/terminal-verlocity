import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Session } from "@/models/Session";
import { getSessionUser } from "@/lib/auth/sessionHelper";
import { hashToken } from "@/lib/auth/tokens";
import { REFRESH_COOKIE_NAME } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const rawRefreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
    const currentTokenHash = rawRefreshToken ? hashToken(rawRefreshToken) : null;

    const sessions = await Session.find({
      userId: sessionUser.userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).sort({ lastUsedAt: -1 });

    const formatted = sessions.map((s) => ({
      sessionId: s._id.toString(),
      userAgent: s.userAgent || "Unknown Browser",
      ipAddress: s.ipAddress || "Unknown",
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      isCurrent: currentTokenHash ? s.sessionTokenHash === currentTokenHash : false,
    }));

    return NextResponse.json({ sessions: formatted });
  } catch (err) {
    console.error("Get sessions error:", err);
    return NextResponse.json({ error: "Failed to load active sessions." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required." }, { status: 400 });
    }

    await connectToDatabase();
    await Session.findOneAndUpdate(
      { _id: sessionId, userId: sessionUser.userId },
      { isRevoked: true }
    );

    return NextResponse.json({ success: true, message: "Session revoked successfully." });
  } catch (err) {
    console.error("Delete session error:", err);
    return NextResponse.json({ error: "Failed to revoke session." }, { status: 500 });
  }
}
