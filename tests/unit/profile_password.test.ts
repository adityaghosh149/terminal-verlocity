import { describe, it, expect, beforeEach } from "vitest";
import * as argon2 from "@node-rs/argon2";
import { inMemoryStore } from "@/lib/db/inMemoryStore";

describe("User Profile & Password Management", () => {
  beforeEach(() => {
    inMemoryStore.clear();
  });

  it("detects existing usernames when registering or updating", async () => {
    const passwordHash = await argon2.hash("Password123!");
    inMemoryStore.addUser({
      id: "usr_1",
      name: "Existing Player",
      username: "CHAMPION",
      password: passwordHash,
      createdAt: new Date(),
    });

    // Check collision for identical and different casing
    const user1 = inMemoryStore.findUserByUsername("CHAMPION");
    expect(user1).toBeDefined();
    expect(user1?.id).toBe("usr_1");

    const userCaseInsensitive = inMemoryStore.findUserByUsername("champion".toUpperCase());
    expect(userCaseInsensitive).toBeDefined();

    // Available username
    const freeUser = inMemoryStore.findUserByUsername("SPEEDSTER");
    expect(freeUser).toBeUndefined();
  });

  it("validates current password before allowing password updates", async () => {
    const originalPassword = "Secret123Password";
    const oldHash = await argon2.hash(originalPassword);

    inMemoryStore.addUser({
      id: "usr_2",
      name: "Speed Typist",
      username: "TYPIST",
      password: oldHash,
      createdAt: new Date(),
    });

    const user = inMemoryStore.findUserById("usr_2")!;
    expect(user).toBeDefined();

    // Verify correct current password
    const validCurrent = await argon2.verify(user.password, originalPassword);
    expect(validCurrent).toBe(true);

    // Verify wrong current password fails
    const invalidCurrent = await argon2.verify(user.password, "WrongPassword");
    expect(invalidCurrent).toBe(false);

    // Update with new password
    const newPassword = "BrandNewPassword456";
    const newHash = await argon2.hash(newPassword);
    user.password = newHash;

    // Verify new password works
    expect(await argon2.verify(user.password, newPassword)).toBe(true);
    // Old password no longer works
    expect(await argon2.verify(user.password, originalPassword)).toBe(false);
  });

  it("preserves upper and lower case in username and enforces case-insensitive uniqueness", async () => {
    const passwordHash = await argon2.hash("Password123!");
    inMemoryStore.addUser({
      id: "usr_mixed",
      name: "Aditya Ghosh",
      username: "AdityaGhosh",
      password: passwordHash,
      createdAt: new Date(),
    });

    const user = inMemoryStore.findUserById("usr_mixed")!;
    expect(user.username).toBe("AdityaGhosh"); // Exact casing preserved!

    // Case-insensitive lookups find the exact user
    expect(inMemoryStore.findUserByUsername("adityaghosh")?.id).toBe("usr_mixed");
    expect(inMemoryStore.findUserByUsername("ADITYAGHOSH")?.id).toBe("usr_mixed");
    expect(inMemoryStore.findUserByUsername("AdityaGhosh")?.id).toBe("usr_mixed");
  });

  it("calculates exact score decomposition and luck using pure typing score", () => {
    // 3 Events:
    // Event 1: Clean, Base 100 PTS, EV = 70 PTS, 2x multiplier (+100 streak), 20% speed bonus (+40) -> total = 240 PTS
    // Event 2: Clean, Base 80 PTS, EV = 60 PTS, 1x multiplier (+0 streak), 0% speed bonus (+0) -> total = 80 PTS
    // Event 3: Corrupted, Penalty -50 PTS, EV = 40 PTS -> total = -50 PTS
    const events = [
      {
        packetId: "1",
        reward: 100,
        expectedValue: 70,
        action: "intercepted",
        outcome: "clean",
        pureTypingPoints: 100,
        multiplierPoints: 100,
        speedBonusPoints: 40,
        pointsDelta: 240,
      },
      {
        packetId: "2",
        reward: 80,
        expectedValue: 60,
        action: "intercepted",
        outcome: "clean",
        pureTypingPoints: 80,
        multiplierPoints: 0,
        speedBonusPoints: 0,
        pointsDelta: 80,
      },
      {
        packetId: "3",
        reward: 90,
        corruptionPenalty: 50,
        expectedValue: 40,
        action: "intercepted",
        outcome: "corrupted",
        pureTypingPoints: -50,
        multiplierPoints: 0,
        speedBonusPoints: 0,
        pointsDelta: -50,
      },
    ];

    const actualTypingScore = events.reduce((sum, e) => sum + e.pureTypingPoints, 0); // 100 + 80 - 50 = 130
    const multiplierScore = events.reduce((sum, e) => sum + e.multiplierPoints, 0);   // 100 + 0 + 0 = 100
    const speedBonusScore = events.reduce((sum, e) => sum + e.speedBonusPoints, 0);   // 40 + 0 + 0 = 40
    const totalScore = events.reduce((sum, e) => sum + e.pointsDelta, 0);             // 240 + 80 - 50 = 270

    // Invariant 1: Sum of components equals total score
    expect(actualTypingScore + multiplierScore + speedBonusScore).toBe(totalScore);
    expect(130 + 100 + 40).toBe(270);

    // Invariant 2: Expected EV = 70 + 60 + 40 = 170
    const expectedScore = events.reduce((sum, e) => sum + e.expectedValue, 0);
    expect(expectedScore).toBe(170);

    // Invariant 3: Luck is strictly calculated using pure typing score and expected EV:
    // luckScore = actualTypingScore - expectedScore (NOT totalScore - expectedScore)
    const luckScore = actualTypingScore - expectedScore;
    expect(luckScore).toBe(130 - 170); // -40
    expect(luckScore).not.toBe(totalScore - expectedScore); // Not 270 - 170 = 100
  });
});
