import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { VerificationChallenge } from "@/models/VerificationChallenge";
import { hashToken, timingSafeEqual } from "@/lib/auth/tokens";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/cookies";
import { checkRateLimit } from "@/lib/auth/rateLimit";

const VerifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(10),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const body = await req.json();
    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid verification request format." }, { status: 400 });
    }

    const { email, code } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit verification attempts to prevent brute-forcing OTPs
    const rateCheck = await checkRateLimit(`verify:${ip}:${normalizedEmail}`, 6, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    await connectToDatabase();

    // Find the latest active verification challenge
    const challenge = await VerificationChallenge.findOne({
      target: normalizedEmail,
      purpose: "EMAIL_VERIFICATION",
      isConsumed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!challenge) {
      return NextResponse.json(
        { error: "No active verification challenge found or the code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Check maximum attempts
    if (challenge.attempts >= challenge.maxAttempts) {
      challenge.isConsumed = true; // Invalidate challenge
      await challenge.save();
      return NextResponse.json(
        { error: "Maximum verification attempts exceeded. Please request a new code." },
        { status: 400 }
      );
    }

    // Increment attempts
    challenge.attempts += 1;
    await challenge.save();

    // Verify hash
    const inputHash = hashToken(code.trim());
    const isMatch = timingSafeEqual(inputHash, challenge.codeHash);

    if (!isMatch) {
      const remaining = challenge.maxAttempts - challenge.attempts;
      return NextResponse.json(
        {
          error: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
          remainingAttempts: remaining,
        },
        { status: 400 }
      );
    }

    // Code matches: consume challenge
    challenge.isConsumed = true;
    await challenge.save();

    // Update user status
    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User record not found." }, { status: 404 });
    }

    // Update access token cookie with isVerified = true
    const newAccessToken = await signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      isVerified: true,
    });

    const cookieStore = cookies();
    cookieStore.set(ACCESS_COOKIE_NAME, newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    return NextResponse.json({
      success: true,
      message: "Email address successfully verified. Welcome to Terminal Velocity!",
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        isVerified: true,
      },
    });
  } catch (err) {
    console.error("Email verification error:", err);
    return NextResponse.json(
      { error: "An error occurred during verification. Please try again." },
      { status: 500 }
    );
  }
}
