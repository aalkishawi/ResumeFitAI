import { describe, it, expect } from "vitest";
import { getPlan, planHasFeature, CREDITS_PER_RUN } from "@/lib/config/plans";

describe("plans", () => {
  it("resolves plans and falls back to free", () => {
    expect(getPlan("pro").key).toBe("pro");
    expect(getPlan("does-not-exist").key).toBe("free");
    expect(getPlan("premium").monthlyScans).toBe(-1); // unlimited
  });

  it("gates features by plan", () => {
    expect(planHasFeature("pro", "cover_letter")).toBe(true);
    expect(planHasFeature("free", "cover_letter")).toBe(false);
    expect(planHasFeature("premium", "premium_model")).toBe(true);
    expect(planHasFeature("free", "premium_model")).toBe(false);
    expect(planHasFeature("team", "white_label")).toBe(true);
  });

  it("charges more credits for premium mode", () => {
    expect(CREDITS_PER_RUN.balanced).toBe(1);
    expect(CREDITS_PER_RUN.premium).toBe(3);
  });
});
