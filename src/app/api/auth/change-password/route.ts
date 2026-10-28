import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { getSessionUser } from "@/lib/auth/sessionHelper";
import { verifyPassword, hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { sendPasswordChangedEmail } from "@/lib/email/service";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid password change payload." }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.message }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(sessionUser.userId).select("+passwordHash");
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(user.passwordHash, currentPassword);
    if (!isCurrentValid) {
      return NextResponse.json({ error: "Current password does not match." }, { status: 400 });
    }

    // Hash new password
    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    // Revoke other active sessions for security
    await Session.updateMany({ userId: user._id }, { isRevoked: true });

    await sendPasswordChangedEmail(user.email, user.username);

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  }
}
