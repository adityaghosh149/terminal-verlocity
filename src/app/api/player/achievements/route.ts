import { NextRequest, NextResponse } from "next/server";
import { ACHIEVEMENT_DEFINITIONS } from "@/models/Achievement";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const achievements = ACHIEVEMENT_DEFINITIONS.map((def) => ({
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      isUnlocked: false,
      unlockedAt: null,
    }));

    return NextResponse.json({ achievements });
  } catch (err) {
    console.error("Achievements error:", err);
    return NextResponse.json({ error: "Failed to load achievements." }, { status: 500 });
  }
}
