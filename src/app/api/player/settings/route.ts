import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { UserSettings } from "@/models/UserSettings";
import { getSessionUser } from "@/lib/auth/sessionHelper";

export const dynamic = "force-dynamic";

const SettingsPatchSchema = z.object({
  theme: z.enum(["midnight", "cyberpunk", "terminal", "amber", "light"]).optional(),
  accentColor: z.string().optional(),
  hudMode: z.enum(["minimal", "standard", "analytical"]).optional(),
  preferredDifficulty: z.enum(["easy", "medium", "hard"]).optional(),
  preferredMode: z.enum(["classic", "endless", "daily"]).optional(),
  soundEnabled: z.boolean().optional(),
  sfxVolume: z.number().min(0).max(1).optional(),
  musicVolume: z.number().min(0).max(1).optional(),
  keyboardClicks: z.boolean().optional(),
  screenShake: z.boolean().optional(),
  particleEffects: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({
        theme: "midnight",
        accentColor: "#00f0ff",
        hudMode: "analytical",
        preferredDifficulty: "medium",
        preferredMode: "classic",
        soundEnabled: true,
        sfxVolume: 0.7,
        musicVolume: 0.5,
        keyboardClicks: true,
        screenShake: true,
        particleEffects: true,
        reducedMotion: false,
      });
    }

    await connectToDatabase();
    const settings = await UserSettings.findOne({ userId: sessionUser.userId });

    return NextResponse.json(
      settings || {
        theme: "midnight",
        accentColor: "#00f0ff",
        hudMode: "analytical",
        preferredDifficulty: "medium",
        preferredMode: "classic",
        soundEnabled: true,
        sfxVolume: 0.7,
        musicVolume: 0.5,
        keyboardClicks: true,
        screenShake: true,
        particleEffects: true,
        reducedMotion: false,
      }
    );
  } catch (err) {
    console.error("Get settings error:", err);
    return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = SettingsPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings format." }, { status: 400 });
    }

    await connectToDatabase();
    const updated = await UserSettings.findOneAndUpdate(
      { userId: sessionUser.userId },
      { $set: parsed.data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, settings: updated });
  } catch (err) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: "Failed to persist settings." }, { status: 500 });
  }
}
