import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { inMemoryStore } from "@/lib/db/inMemoryStore";
import {
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  cookieOptions,
} from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;

    // 1. First, attempt to verify current access token
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload && payload.userId) {
        let settings = undefined;
        try {
          const db = await connectToDatabase();
          if (db) {
            const u = await User.findById(payload.userId).select("settings").lean();
            if (u) settings = (u as any).settings;
          } else {
            const u = inMemoryStore.findUserById(payload.userId);
            if (u) settings = u.settings;
          }
        } catch {
          // Ignore error and return payload
        }

        return NextResponse.json({
          user: {
            id: payload.userId,
            name: payload.name || payload.username,
            username: payload.username,
            settings,
          },
        });
      }
    }

    // 2. Access token missing or expired: Attempt silent renewal via Refresh Token!
    const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
    if (!refreshToken) {
      return NextResponse.json({ user: null });
    }

    const refreshPayload = await verifyRefreshToken(refreshToken);
    if (!refreshPayload || !refreshPayload.userId) {
      return NextResponse.json({ user: null });
    }

    const db = await connectToDatabase();
    let foundUser: { id: string; name: string; username: string; settings?: any } | null = null;

    if (db) {
      const user = await User.findById(refreshPayload.userId);
      if (user) {
        foundUser = {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          settings: user.settings,
        };
      }
    } else {
      const user = inMemoryStore.findUserById(refreshPayload.userId);
      if (user) {
        foundUser = {
          id: user.id,
          name: user.name,
          username: user.username,
          settings: user.settings,
        };
      }
    }

    if (!foundUser) {
      return NextResponse.json({ user: null });
    }

    // Mint fresh access token and attach to response
    const newAccessToken = await signAccessToken({
      userId: foundUser.id,
      username: foundUser.username,
      name: foundUser.name,
    });

    const response = NextResponse.json({
      user: {
        id: foundUser.id,
        name: foundUser.name,
        username: foundUser.username,
        settings: foundUser.settings,
      },
    });

    response.cookies.set(ACCESS_COOKIE_NAME, newAccessToken, cookieOptions.access);
    return response;
  } catch (err) {
    console.error("Auth me error:", err);
    return NextResponse.json({ user: null });
  }
}
