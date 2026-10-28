import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken } from "@/lib/auth/jwt";
import { generateRefreshToken } from "@/lib/auth/tokens";
import { setAuthCookies } from "@/lib/auth/cookies";
import { checkRateLimit } from "@/lib/auth/rateLimit";

const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid login credentials." },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const cleanIdentifier = identifier.trim().toLowerCase();

    // Rate limit login attempts: max 5 attempts per 60 seconds per IP+identifier
    const rateCheck = await checkRateLimit(`login:${ip}:${cleanIdentifier}`, 5, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    await connectToDatabase();

    // Support logging in via either email or username
    const user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }],
    }).select("+passwordHash");

    if (!user) {
      // Dummy check to prevent timing analysis
      return NextResponse.json(
        { error: "Invalid email/username or password." },
        { status: 401 }
      );
    }

    // Verify Argon2id password hash
    const isValid = await verifyPassword(user.passwordHash, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email/username or password." },
        { status: 401 }
      );
    }

    // Generate refresh session
    const { plainToken, tokenHash, familyId, expiresAt } = generateRefreshToken();
    const userAgent = req.headers.get("user-agent") || "Unknown Browser";

    await Session.create({
      userId: user._id,
      sessionTokenHash: tokenHash,
      familyId,
      expiresAt,
      userAgent,
      ipAddress: ip,
      lastUsedAt: new Date(),
    });

    // Issue JWT access token
    const accessToken = await signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      isVerified: user.isVerified,
    });

    // Set secure HTTP-only cookies
    const cookieStore = cookies();
    setAuthCookies(cookieStore, accessToken, plainToken);

    return NextResponse.json({
      success: true,
      message: "Authentication successful.",
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
      },
    });
  } catch (err) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
