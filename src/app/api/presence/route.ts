import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Presence } from "@/models/Presence";
import { inMemoryStore } from "@/lib/db/inMemoryStore";
import {
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth/jwt";

async function getAuthenticatedUser(req: NextRequest): Promise<{ userId?: string; username?: string }> {
  try {
    const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload?.userId) {
        return { userId: payload.userId, username: payload.username };
      }
    }
    const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
    if (refreshToken) {
      const payload = await verifyRefreshToken(refreshToken);
      if (payload?.userId) {
        return { userId: payload.userId, username: payload.username };
      }
    }
  } catch {}
  return {};
}

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (db) {
      const cutoff = new Date(Date.now() - 60 * 1000);
      const count = await Presence.countDocuments({ lastSeen: { $gte: cutoff } });
      return NextResponse.json({
        onlineCount: Math.max(1, count),
        timestamp: Date.now(),
      });
    }

    const fallbackCount = inMemoryStore.getOnlineCount();
    return NextResponse.json({
      onlineCount: Math.max(1, fallbackCount),
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Presence GET error:", error);
    const fallbackCount = inMemoryStore.getOnlineCount();
    return NextResponse.json({
      onlineCount: Math.max(1, fallbackCount),
      timestamp: Date.now(),
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req);

    const sessionId = (body.sessionId && typeof body.sessionId === "string")
      ? body.sessionId.slice(0, 64)
      : "anon_" + Math.random().toString(36).substring(2, 12);

    const username = authUser.username || (typeof body.username === "string" ? body.username.slice(0, 30) : "guest");
    const userId = authUser.userId;
    const path = typeof body.path === "string" ? body.path.slice(0, 80) : "/";

    const db = await connectToDatabase();
    if (db) {
      const now = new Date();
      await Presence.findOneAndUpdate(
        { sessionId },
        {
          sessionId,
          userId,
          username,
          path,
          lastSeen: now,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const cutoff = new Date(Date.now() - 60 * 1000);
      const count = await Presence.countDocuments({ lastSeen: { $gte: cutoff } });
      return NextResponse.json({
        onlineCount: Math.max(1, count),
        sessionId,
      });
    }

    const memCount = inMemoryStore.recordPresence(sessionId, userId, username, path);
    return NextResponse.json({
      onlineCount: Math.max(1, memCount),
      sessionId,
    });
  } catch (error) {
    console.error("Presence POST error:", error);
    const fallbackCount = inMemoryStore.getOnlineCount();
    return NextResponse.json({
      onlineCount: Math.max(1, fallbackCount),
    });
  }
}
