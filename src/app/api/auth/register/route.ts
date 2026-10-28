import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { VerificationChallenge } from "@/models/VerificationChallenge";
import { Session } from "@/models/Session";
import { UserSettings } from "@/models/UserSettings";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { signAccessToken } from "@/lib/auth/jwt";
import { generateRefreshToken } from "@/lib/auth/tokens";
import { generateNumericOtp } from "@/lib/auth/otp";
import { setAuthCookies } from "@/lib/auth/cookies";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { sendVerificationEmail } from "@/lib/email/service";

const RegisterSchema = z.object({
  email: z.string().email("Invalid email format").max(100),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain alphanumeric characters, underscores, and hyphens"),
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(30),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = await checkRateLimit(`register:${ip}`, 5, 300); // 5 attempts per 5 mins
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { email, username, displayName, password } = parsed.data;

    // Validate password complexity
    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.valid) {
      return NextResponse.json({ error: passwordStrength.message }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    // Check existing email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // Check existing username
    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return NextResponse.json(
        { error: "This username is already taken. Please choose another." },
        { status: 409 }
      );
    }

    // Hash password with Argon2id
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await User.create({
      email: normalizedEmail,
      username: normalizedUsername,
      displayName: displayName.trim(),
      passwordHash,
      isVerified: false,
    });

    // Create default user settings
    await UserSettings.create({
      userId: newUser._id,
      theme: "midnight",
      hudMode: "analytical",
      preferredDifficulty: "medium",
      preferredMode: "classic",
    });

    // Generate 6-digit OTP verification challenge
    const otpChallenge = generateNumericOtp("EMAIL_VERIFICATION", 10);
    await VerificationChallenge.create({
      target: normalizedEmail,
      purpose: "EMAIL_VERIFICATION",
      codeHash: otpChallenge.codeHash,
      expiresAt: otpChallenge.expiresAt,
      maxAttempts: 5,
    });

    // Dispatch verification email (or dev console fallback)
    await sendVerificationEmail(normalizedEmail, normalizedUsername, otpChallenge.code);

    // Issue session and tokens
    const { plainToken, tokenHash, familyId, expiresAt } = generateRefreshToken();
    const userAgent = req.headers.get("user-agent") || "Unknown Browser";

    await Session.create({
      userId: newUser._id,
      sessionTokenHash: tokenHash,
      familyId,
      expiresAt,
      userAgent,
      ipAddress: ip,
    });

    const accessToken = await signAccessToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      username: newUser.username,
      isVerified: newUser.isVerified,
    });

    const cookieStore = cookies();
    setAuthCookies(cookieStore, accessToken, plainToken);

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please enter the verification code sent to your email.",
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        username: newUser.username,
        displayName: newUser.displayName,
        isVerified: newUser.isVerified,
      },
    });
  } catch (err: unknown) {
    console.error("Registration route error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
