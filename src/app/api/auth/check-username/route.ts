import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { inMemoryStore } from "@/lib/db/inMemoryStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username")?.trim();
    const excludeUserId = searchParams.get("excludeUserId")?.trim();

    if (!username || username.length < 3) {
      return NextResponse.json({
        available: false,
        message: "Username must be at least 3 characters",
      });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json({
        available: false,
        message: "Username can only contain letters, numbers, underscores and hyphens",
      });
    }

    const lowerUsername = username.toLowerCase();
    const db = await connectToDatabase();
    if (db) {
      const existingUser = await User.findOne({
        $or: [
          { usernameLower: lowerUsername },
          { username: new RegExp(`^${username.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i") },
        ],
      });
      if (existingUser) {
        if (excludeUserId && existingUser._id.toString() === excludeUserId) {
          return NextResponse.json({ available: true, message: "Current username" });
        }
        return NextResponse.json({
          available: false,
          message: `Username '${username}' is already taken`,
        });
      }
    } else {
      const existingUser = inMemoryStore.findUserByUsername(username);
      if (existingUser) {
        if (excludeUserId && existingUser.id === excludeUserId) {
          return NextResponse.json({ available: true, message: "Current username" });
        }
        return NextResponse.json({
          available: false,
          message: `Username '${username}' is already taken`,
        });
      }
    }

    return NextResponse.json({ available: true, message: "Username is available" });
  } catch (err) {
    console.error("Check username error:", err);
    return NextResponse.json({ available: true });
  }
}
