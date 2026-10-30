import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as argon2 from "@node-rs/argon2";
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

const LoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    const { username, password } = result.data;
    const cleanUsername = username.trim();
    const lowerUsername = cleanUsername.toLowerCase();

    const db = await connectToDatabase();
    let foundUser: { id: string; name: string; username: string; password: string; settings?: any } | null = null;

    if (db) {
      const user = await User.findOne({
        $or: [
          { usernameLower: lowerUsername },
          { username: new RegExp(`^${cleanUsername.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i") },
        ],
      });
      if (user) {
        foundUser = {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          password: user.password,
          settings: user.settings,
        };
      }
    } else {
      const user = inMemoryStore.findUserByUsername(cleanUsername);
      if (user) {
        foundUser = user;
      }
    }

    if (!foundUser) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const isValidPassword = await argon2.verify(foundUser.password, password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // Sign Access Token (15m) & Refresh Token (30d) using the stored casing
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ userId: foundUser.id, username: foundUser.username, name: foundUser.name }),
      signRefreshToken({ userId: foundUser.id, username: foundUser.username }),
    ]);

    const response = NextResponse.json({
      success: true,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        username: foundUser.username,
        settings: foundUser.settings,
      },
    });

    response.cookies.set(ACCESS_COOKIE_NAME, accessToken, cookieOptions.access);
    response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, cookieOptions.refresh);

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
