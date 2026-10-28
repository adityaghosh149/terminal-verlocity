import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Session } from "@/models/Session";
import { getSessionUser } from "@/lib/auth/sessionHelper";
import { clearAuthCookies } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    // Revoke all sessions for this user
    await Session.updateMany({ userId: user.userId }, { isRevoked: true });

    const cookieStore = cookies();
    clearAuthCookies(cookieStore);

    return NextResponse.json({
      success: true,
      message: "All active sessions have been terminated.",
    });
  } catch (err) {
    console.error("Logout-all error:", err);
    return NextResponse.json({ error: "Failed to revoke all sessions." }, { status: 500 });
  }
}
