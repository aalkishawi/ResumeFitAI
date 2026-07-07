import { describe, it, expect } from "vitest";
import { cacheKey, getCached, setCached } from "@/lib/ai/cache";
import type { AnalysisResult } from "@/lib/types";

const base = { resume: "my resume text", jobDescription: "a job", instruction: "", mode: "balanced" };

describe("response cache", () => {
  it("produces a stable key for identical input", () => {
    expect(cacheKey(base)).toBe(cacheKey({ ...base }));
  });

  it("changes the key when any input or the mode changes", () => {
    expect(cacheKey(base)).not.toBe(cacheKey({ ...base, resume: "different" }));
    expect(cacheKey(base)).not.toBe(cacheKey({ ...base, mode: "premium" }));
  });

  it("round-trips a stored result and misses on a different key", () => {
    const key = cacheKey({ ...base, resume: "unique-cache-test-" + Math.random() });
    const result = { tailoredResume: "hello" } as unknown as AnalysisResult;
    expect(getCached(key)).toBeNull();
    setCached(key, result);
    expect(getCached(key)).toBe(result);
    expect(getCached("some-other-key")).toBeNull();
  });
});
