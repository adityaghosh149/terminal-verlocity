import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { VerificationChallenge } from "@/models/VerificationChallenge";
import { generateNumericOtp } from "@/lib/auth/otp";
import { sendVerificationEmail } from "@/lib/email/service";
import { checkRateLimit } from "@/lib/auth/rateLimit";

const ResendSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const body = await req.json();
    const parsed = ResendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email address format." }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.toLowerCase().trim();

    // Rate limit resend to 1 per 60 seconds
    const rateCheck = await checkRateLimit(`resend:${normalizedEmail}`, 1, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Please wait ${rateCheck.resetSeconds} seconds before requesting a new code.` },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const user = await User.findOne({ email: normalizedEmail });

    // Always return safe generic success message to prevent account enumeration
    if (user && !user.isVerified) {
      // Invalidate existing challenges
      await VerificationChallenge.updateMany(
        { target: normalizedEmail, purpose: "EMAIL_VERIFICATION", isConsumed: false },
        { isConsumed: true }
      );

      // Create new challenge
      const otpChallenge = generateNumericOtp("EMAIL_VERIFICATION", 10);
      await VerificationChallenge.create({
        target: normalizedEmail,
        purpose: "EMAIL_VERIFICATION",
        codeHash: otpChallenge.codeHash,
        expiresAt: otpChallenge.expiresAt,
        maxAttempts: 5,
      });

      await sendVerificationEmail(user.email, user.username, otpChallenge.code);
    }

    return NextResponse.json({
      success: true,
      message: "If an unverified account exists with this email, a new verification code has been dispatched.",
    });
  } catch (err) {
    console.error("Resend verification error:", err);
    return NextResponse.json(
      { error: "Failed to resend verification code. Please try again later." },
      { status: 500 }
    );
  }
}
