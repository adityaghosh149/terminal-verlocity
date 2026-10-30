import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { GameRun } from "@/models/GameRun";
import { inMemoryStore } from "@/lib/db/inMemoryStore";
import {
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  cookieOptions,
} from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

const UpdateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(50, "Name too long").optional(),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores and dashes")
    .optional(),
});

async function getAuthenticatedUser(req: NextRequest): Promise<{ userId: string; username: string } | null> {
  const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload?.userId) return { userId: payload.userId, username: payload.username };
  }
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (refreshToken) {
    const refreshPayload = await verifyRefreshToken(refreshToken);
    if (refreshPayload?.userId) return { userId: refreshPayload.userId, username: refreshPayload.username };
  }
  return null;
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const result = UpdateProfileSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.errors[0]?.message || "Invalid profile data";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, username } = result.data;
    if (!name && !username) {
      return NextResponse.json({ error: "No fields provided to update." }, { status: 400 });
    }

    const db = await connectToDatabase();
    const cleanUsername = username ? username.trim() : undefined;
    const lowerUsername = cleanUsername ? cleanUsername.toLowerCase() : undefined;

    // Check if new username is already taken by someone else (case-insensitively)
    if (cleanUsername && cleanUsername.toLowerCase() !== auth.username.toLowerCase()) {
      if (db) {
        const existing = await User.findOne({
          $or: [
            { usernameLower: lowerUsername },
            { username: new RegExp(`^${cleanUsername.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i") },
          ],
        });
        if (existing && existing._id.toString() !== auth.userId) {
          return NextResponse.json(
            { error: `Username '${cleanUsername}' is already taken. Please choose another.` },
            { status: 409 }
          );
        }
      } else {
        const existing = inMemoryStore.findUserByUsername(cleanUsername);
        if (existing && existing.id !== auth.userId) {
          return NextResponse.json(
            { error: `Username '${cleanUsername}' is already taken. Please choose another.` },
            { status: 409 }
          );
        }
      }
    }

    let updatedUser: {
      id: string;
      name: string;
      username: string;
      settings?: any;
    } | null = null;

    if (db) {
      const updateFields: Record<string, string> = {};
      if (name) updateFields.name = name;
      if (cleanUsername) {
        updateFields.username = cleanUsername;
        updateFields.usernameLower = cleanUsername.toLowerCase();
      }

      const userDoc = await User.findByIdAndUpdate(auth.userId, { $set: updateFields }, { new: true });
      if (!userDoc) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // If username changed, update leaderboard game runs to reflect new username
      if (cleanUsername && cleanUsername !== auth.username) {
        await GameRun.updateMany(
          { $or: [{ userId: auth.userId }, { playerName: auth.username }] },
          { $set: { playerName: cleanUsername } }
        );
      }

      updatedUser = {
        id: userDoc._id.toString(),
        name: userDoc.name,
        username: userDoc.username,
        settings: userDoc.settings,
      };
    } else {
      const memUser = inMemoryStore.findUserById(auth.userId);
      if (!memUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (name) memUser.name = name;
      if (cleanUsername) memUser.username = cleanUsername;

      updatedUser = {
        id: memUser.id,
        name: memUser.name,
        username: memUser.username,
        settings: memUser.settings,
      };
    }

    // Generate renewed JWT tokens with the updated name and username
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({
        userId: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
      }),
      signRefreshToken({
        userId: updatedUser.id,
        username: updatedUser.username,
      }),
    ]);

    const res = NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });

    res.cookies.set(ACCESS_COOKIE_NAME, accessToken, cookieOptions.access);
    res.cookies.set(REFRESH_COOKIE_NAME, refreshToken, cookieOptions.refresh);

    return res;
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
