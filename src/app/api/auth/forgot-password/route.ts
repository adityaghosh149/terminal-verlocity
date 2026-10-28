import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { VerificationChallenge } from "@/models/VerificationChallenge";
import { generateNumericOtp, generateResetToken } from "@/lib/auth/otp";
import { sendPasswordResetEmail } from "@/lib/email/service";
import { checkRateLimit } from "@/lib/auth/rateLimit";

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email address format." }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.toLowerCase().trim();

    // Rate limit password reset requests (3 per 10 minutes per IP)
    const rateCheck = await checkRateLimit(`forgot-pwd:${ip}:${normalizedEmail}`, 3, 600);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many reset requests. Please check your inbox or try again in a few minutes." },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const user = await User.findOne({ email: normalizedEmail });

    // Always respond with a generic message to prevent account enumeration
    if (user) {
      // Invalidate existing password reset challenges
      await VerificationChallenge.updateMany(
        { target: normalizedEmail, purpose: "PASSWORD_RESET", isConsumed: false },
        { isConsumed: true }
      );

      // Generate numeric OTP challenge & reset link token
      const otpChallenge = generateNumericOtp("PASSWORD_RESET", 15);
      const linkTokenChallenge = generateResetToken(15);

      // Store both so the user can verify via either link or manual code entry
      await VerificationChallenge.create([
        {
          target: normalizedEmail,
          purpose: "PASSWORD_RESET",
          codeHash: otpChallenge.codeHash,
          expiresAt: otpChallenge.expiresAt,
          maxAttempts: 3,
        },
        {
          target: normalizedEmail,
          purpose: "PASSWORD_RESET",
          codeHash: linkTokenChallenge.codeHash,
          expiresAt: linkTokenChallenge.expiresAt,
          maxAttempts: 3,
        },
      ]);

      await sendPasswordResetEmail(
        user.email,
        user.username,
        linkTokenChallenge.code,
        otpChallenge.code
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "If an operative account is registered with that email, security credentials have been dispatched.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Failed to process password recovery. Please try again later." },
      { status: 500 }
    );
  }
}
