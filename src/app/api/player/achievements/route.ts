import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Achievement, ACHIEVEMENT_DEFINITIONS } from "@/models/Achievement";
import { getSessionUser } from "@/lib/auth/sessionHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    let unlockedMap: Record<string, Date> = {};

    if (sessionUser?.userId) {
      await connectToDatabase();
      const unlocked = await Achievement.find({ userId: sessionUser.userId }).lean();
      unlockedMap = unlocked.reduce((acc, a) => {
        acc[a.achievementId] = a.unlockedAt;
        return acc;
      }, {} as Record<string, Date>);
    }

    const achievements = ACHIEVEMENT_DEFINITIONS.map((def) => ({
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      isUnlocked: Boolean(unlockedMap[def.id]),
      unlockedAt: unlockedMap[def.id] || null,
    }));

    return NextResponse.json({ achievements });
  } catch (err) {
    console.error("Achievements error:", err);
    return NextResponse.json({ error: "Failed to load achievements." }, { status: 500 });
  }
}
