import { describe, it, expect, beforeEach } from "vitest";
import { inMemoryStore } from "@/lib/db/inMemoryStore";

describe("Online Presence System", () => {
  beforeEach(() => {
    inMemoryStore.clear();
  });

  it("registers active sessions and reports online runner counts accurately", () => {
    expect(inMemoryStore.getOnlineCount()).toBe(0);

    // Register 3 distinct client sessions
    const count1 = inMemoryStore.recordPresence("sess_1", "user_1", "alice", "/game");
    expect(count1).toBe(1);

    const count2 = inMemoryStore.recordPresence("sess_2", "user_2", "bob", "/dashboard");
    expect(count2).toBe(2);

    const count3 = inMemoryStore.recordPresence("sess_3", undefined, "guest_99", "/");
    expect(count3).toBe(3);
    expect(inMemoryStore.getOnlineCount()).toBe(3);

    // Re-pinging an existing session refreshes timestamp without inflating count
    const countRefresh = inMemoryStore.recordPresence("sess_1", "user_1", "alice", "/game");
    expect(countRefresh).toBe(3);
    expect(inMemoryStore.getOnlineCount()).toBe(3);
  });

  it("handles clearing presence store cleanly", () => {
    inMemoryStore.recordPresence("sess_alpha", undefined, "playerA", "/game");
    expect(inMemoryStore.getOnlineCount()).toBe(1);
    inMemoryStore.clear();
    expect(inMemoryStore.getOnlineCount()).toBe(0);
  });
});
