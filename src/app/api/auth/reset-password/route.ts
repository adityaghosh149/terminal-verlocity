import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { VerificationChallenge } from "@/models/VerificationChallenge";
import { Session } from "@/models/Session";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { hashToken, timingSafeEqual } from "@/lib/auth/tokens";
import { sendPasswordChangedEmail } from "@/lib/email/service";
import { checkRateLimit } from "@/lib/auth/rateLimit";

const ResetPasswordSchema = z.object({
  email: z.string().email(),
  codeOrToken: z.string().min(4),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const body = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid password reset submission." }, { status: 400 });
    }

    const { email, codeOrToken, newPassword } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limit on reset submissions
    const rateCheck = await checkRateLimit(`reset-pwd:${ip}:${normalizedEmail}`, 5, 120);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please wait a few moments." },
        { status: 429 }
      );
    }

    // Validate new password complexity
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.message }, { status: 400 });
    }

    await connectToDatabase();

    const inputHash = hashToken(codeOrToken.trim());

    // Find active password reset challenge matching hash
    const challenge = await VerificationChallenge.findOne({
      target: normalizedEmail,
      purpose: "PASSWORD_RESET",
      codeHash: inputHash,
      isConsumed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Invalid, expired, or previously used recovery code/token." },
        { status: 400 }
      );
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      challenge.isConsumed = true;
      await challenge.save();
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new password reset." },
        { status: 400 }
      );
    }

    // Verify hash safely
    if (!timingSafeEqual(inputHash, challenge.codeHash)) {
      challenge.attempts += 1;
      await challenge.save();
      return NextResponse.json(
        { error: "Incorrect recovery code." },
        { status: 400 }
      );
    }

    // Consume challenge
    challenge.isConsumed = true;
    await challenge.save();

    // Also consume any other pending reset challenges for this user
    await VerificationChallenge.updateMany(
      { target: normalizedEmail, purpose: "PASSWORD_RESET" },
      { isConsumed: true }
    );

    // Hash new password with Argon2id
    const newPasswordHash = await hashPassword(newPassword);

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { passwordHash: newPasswordHash, isVerified: true },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User record not found." }, { status: 404 });
    }

    // Invalidate ALL prior active sessions as security precaution
    await Session.updateMany({ userId: user._id }, { isRevoked: true });

    // Send security notification
    await sendPasswordChangedEmail(user.email, user.username);

    return NextResponse.json({
      success: true,
      message: "Password reset successful. All previous sessions have been revoked. Please sign in with your new password.",
    });
  } catch (err) {
    console.error("Password reset error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting password." },
      { status: 500 }
    );
  }
}
