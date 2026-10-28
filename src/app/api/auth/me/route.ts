import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { UserSettings } from "@/models/UserSettings";
import { getSessionUser } from "@/lib/auth/sessionHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    await connectToDatabase();
    const user = await User.findById(sessionUser.userId);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const settings = await UserSettings.findOne({ userId: user._id });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        isVerified: user.isVerified,
        level: user.level,
        xp: user.xp,
        lifetimeScore: user.lifetimeScore,
        bestScore: user.bestScore,
        gamesPlayed: user.gamesPlayed,
        packetsClean: user.packetsClean,
        packetsCorrupted: user.packetsCorrupted,
        packetsMissed: user.packetsMissed,
        bestWpm: user.bestWpm,
        avgAccuracy: user.avgAccuracy,
        createdAt: user.createdAt,
      },
      settings: settings || {
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
      },
    });
  } catch (err) {
    console.error("Get /api/auth/me error:", err);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
