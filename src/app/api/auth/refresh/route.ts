import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { inMemoryStore } from "@/lib/db/inMemoryStore";
import {
  verifyRefreshToken,
  signAccessToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  cookieOptions,
} from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token provided." }, { status: 401 });
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid or expired refresh token." }, { status: 401 });
    }

    const db = await connectToDatabase();
    let foundUser: { id: string; name: string; username: string } | null = null;

    if (db) {
      const user = await User.findById(payload.userId);
      if (user) {
        foundUser = {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
        };
      }
    } else {
      const user = inMemoryStore.findUserById(payload.userId);
      if (user) {
        foundUser = {
          id: user.id,
          name: user.name,
          username: user.username,
        };
      }
    }

    if (!foundUser) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const newAccessToken = await signAccessToken({
      userId: foundUser.id,
      username: foundUser.username,
      name: foundUser.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        username: foundUser.username,
      },
    });

    response.cookies.set(ACCESS_COOKIE_NAME, newAccessToken, cookieOptions.access);
    return response;
  } catch (err) {
    console.error("Token refresh error:", err);
    return NextResponse.json({ error: "Failed to refresh token." }, { status: 500 });
  }
}
