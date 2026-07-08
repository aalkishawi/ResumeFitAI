import { describe, it, expect, vi } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("rate limiter", () => {
  it("allows up to the limit, then blocks with a retry-after", () => {
    const key = "test-" + Math.random();
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000).ok).toBe(true);
    }
    const blocked = checkRateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    try {
      const key = "reset-" + Math.random();
      expect(checkRateLimit(key, 1, 1000).ok).toBe(true);
      expect(checkRateLimit(key, 1, 1000).ok).toBe(false);
      vi.advanceTimersByTime(1001);
      expect(checkRateLimit(key, 1, 1000).ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps separate counters per key", () => {
    const a = "a-" + Math.random();
    const b = "b-" + Math.random();
    expect(checkRateLimit(a, 1, 60_000).ok).toBe(true);
    expect(checkRateLimit(a, 1, 60_000).ok).toBe(false);
    expect(checkRateLimit(b, 1, 60_000).ok).toBe(true); // b is independent
  });
});
