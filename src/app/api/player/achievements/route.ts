import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { Achievement, ACHIEVEMENT_DEFINITIONS } from "@/models/Achievement";
import {
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload?.userId) return payload.userId;
  }
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (refreshToken) {
    const refreshPayload = await verifyRefreshToken(refreshToken);
    if (refreshPayload?.userId) return refreshPayload.userId;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryUsername = searchParams.get("username")?.trim();
    const authUserId = await getAuthenticatedUserId(req);

    const db = await connectToDatabase();
    let targetUserId = authUserId;

    if (queryUsername && db) {
      const found = await User.findOne({
        usernameLower: queryUsername.toLowerCase(),
      }).select("_id");
      if (found) {
        targetUserId = found._id.toString();
      }
    }

    let unlockedMap = new Map<string, Date>();

    if (db && targetUserId) {
      const records = await Achievement.find({ userId: targetUserId }).lean();
      for (const rec of records) {
        unlockedMap.set(rec.achievementId, rec.unlockedAt || new Date());
      }
    }

    const achievements = ACHIEVEMENT_DEFINITIONS.map((def) => {
      const isUnlocked = unlockedMap.has(def.id);
      return {
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        isUnlocked,
        unlockedAt: isUnlocked ? unlockedMap.get(def.id) : null,
      };
    });

    return NextResponse.json({
      achievements,
      unlockedCount: unlockedMap.size,
      totalCount: ACHIEVEMENT_DEFINITIONS.length,
    });
  } catch (err) {
    console.error("Achievements error:", err);
    return NextResponse.json({ error: "Failed to load achievements." }, { status: 500 });
  }
}
