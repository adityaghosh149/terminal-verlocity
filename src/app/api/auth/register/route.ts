import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as argon2 from "@node-rs/argon2";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { inMemoryStore } from "@/lib/db/inMemoryStore";
import {
  signAccessToken,
  signRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  cookieOptions,
} from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Name too long"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores and dashes"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.errors[0]?.message || "Invalid input data";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, username, password } = result.data;
    const cleanUsername = username.trim();
    const lowerUsername = cleanUsername.toLowerCase();

    const db = await connectToDatabase();

    // Check unique username (case-insensitive)
    if (db) {
      const existingUser = await User.findOne({
        $or: [
          { usernameLower: lowerUsername },
          { username: new RegExp(`^${cleanUsername.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i") },
        ],
      });
      if (existingUser) {
        return NextResponse.json(
          { error: `Username '${cleanUsername}' is already taken. Please choose another.` },
          { status: 409 }
        );
      }
    } else {
      const existingUser = inMemoryStore.findUserByUsername(cleanUsername);
      if (existingUser) {
        return NextResponse.json(
          { error: `Username '${cleanUsername}' is already taken. Please choose another.` },
          { status: 409 }
        );
      }
    }

    // Secure password hash using Argon2id
    const hashedPassword = await argon2.hash(password);
    let userId: string;

    const defaultSettings = {
      theme: "midnight",
      preferredDifficulty: "medium" as const,
      preferredMode: "classic" as const,
      soundEnabled: true,
      screenShake: true,
    };

    if (db) {
      const newUser = await User.create({
        name,
        username: cleanUsername,
        usernameLower: lowerUsername,
        password: hashedPassword,
        settings: defaultSettings,
      });
      userId = newUser._id.toString();
    } else {
      userId = "usr_" + crypto.randomUUID();
      inMemoryStore.addUser({
        id: userId,
        name,
        username: cleanUsername,
        password: hashedPassword,
        settings: defaultSettings,
        createdAt: new Date(),
      });
    }

    // Sign Access Token (15m) & Refresh Token (30d)
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ userId, username: cleanUsername, name }),
      signRefreshToken({ userId, username: cleanUsername }),
    ]);

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        username: cleanUsername,
        settings: defaultSettings,
      },
    });

    // Attach httpOnly secure cookies
    response.cookies.set(ACCESS_COOKIE_NAME, accessToken, cookieOptions.access);
    response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, cookieOptions.refresh);

    return response;
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
