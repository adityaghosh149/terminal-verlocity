import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
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

export async function PATCH() {
  return NextResponse.json({
    success: true,
    message: "Settings synchronized locally.",
  });
}
