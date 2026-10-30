import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SignJWT } from "jose";
import crypto from "crypto";

const StartRunSchema = z.object({
  mode: z.enum(["classic", "endless", "daily"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  username: z.string().max(20).optional(),
});

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "fallback_run_signing_secret_min_32_chars";
const getRunSecret = () => new TextEncoder().encode(JWT_SECRET + "_game_run");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = StartRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid game parameters." }, { status: 400 });
    }

    const { mode, difficulty, username } = parsed.data;
    const playerName = (username || "").trim().slice(0, 20) || "Player";

    const runId = "run_" + crypto.randomUUID();
    const startTime = Date.now();

    // Deterministic seed generation
    let seed: string;
    if (mode === "daily") {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      seed = `challenge_${today}`;
    } else {
      seed = `seed_${crypto.randomBytes(8).toString("hex")}`;
    }

    // Sign a tamper-evident run authorization token containing the username
    const runToken = await new SignJWT({
      runId,
      username: playerName,
      mode,
      difficulty,
      seed,
      startTime,
      tokenType: "game_run_token",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(getRunSecret());

    return NextResponse.json({
      success: true,
      runId,
      runToken,
      username: playerName,
      mode,
      difficulty,
      seed,
      startTime,
    });
  } catch (err) {
    console.error("Game start error:", err);
    return NextResponse.json({ error: "Failed to initialize game run." }, { status: 500 });
  }
}
