import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as argon2 from "@node-rs/argon2";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { inMemoryStore } from "@/lib/db/inMemoryStore";
import {
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(100),
  confirmNewPassword: z.string().min(1, "Please re-enter your new password"),
});

async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload?.userId) return payload.userId;
  }
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (refreshToken) {
    const refreshPayload = await verifyRefreshToken(refreshToken);
    if (refreshPayload?.userId) return refreshPayload.userId;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const result = ChangePasswordSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.errors[0]?.message || "Invalid input";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { currentPassword, newPassword, confirmNewPassword } = result.data;

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { error: "New password and confirmation do not match." },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    let currentHashedPassword = "";

    if (db) {
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ error: "User account not found." }, { status: 404 });
      }
      currentHashedPassword = user.password;
    } else {
      const user = inMemoryStore.findUserById(userId);
      if (!user) {
        return NextResponse.json({ error: "User account not found." }, { status: 404 });
      }
      currentHashedPassword = user.password;
    }

    // Verify current password with Argon2
    const isCurrentValid = await argon2.verify(currentHashedPassword, currentPassword);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    // Hash new password
    const newHashedPassword = await argon2.hash(newPassword);

    if (db) {
      await User.findByIdAndUpdate(userId, { $set: { password: newHashedPassword } });
    } else {
      const user = inMemoryStore.findUserById(userId);
      if (user) {
        user.password = newHashedPassword;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  }
}
