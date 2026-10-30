import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { inMemoryStore } from "@/lib/db/inMemoryStore";
import {
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

const UpdateSettingsSchema = z.object({
  theme: z.string().optional(),
  preferredDifficulty: z.enum(["easy", "medium", "hard"]).optional(),
  preferredMode: z.enum(["classic", "endless", "daily"]).optional(),
  soundEnabled: z.boolean().optional(),
  screenShake: z.boolean().optional(),
});

const DEFAULT_SETTINGS = {
  theme: "midnight",
  preferredDifficulty: "medium" as const,
  preferredMode: "classic" as const,
  soundEnabled: true,
  screenShake: true,
};

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
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    const db = await connectToDatabase();
    if (db) {
      const user = await User.findById(userId).lean();
      if (user && (user as any).settings) {
        return NextResponse.json({ ...DEFAULT_SETTINGS, ...(user as any).settings });
      }
    } else {
      const user = inMemoryStore.findUserById(userId);
      if (user && user.settings) {
        return NextResponse.json({ ...DEFAULT_SETTINGS, ...user.settings });
      }
    }

    return NextResponse.json(DEFAULT_SETTINGS);
  } catch (err) {
    console.error("Get settings error:", err);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings format" }, { status: 400 });
    }

    const updates = parsed.data;
    const db = await connectToDatabase();

    if (db) {
      const updateFields: Record<string, any> = {};
      for (const [key, val] of Object.entries(updates)) {
        if (val !== undefined) {
          updateFields[`settings.${key}`] = val;
        }
      }
      await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true });
    } else {
      const user = inMemoryStore.findUserById(userId);
      if (user) {
        user.settings = { ...(user.settings || DEFAULT_SETTINGS), ...updates };
      }
    }

    return NextResponse.json({
      success: true,
      message: "User preferences saved.",
      settings: updates,
    });
  } catch (err) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
