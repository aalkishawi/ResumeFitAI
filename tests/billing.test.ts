import { describe, it, expect } from "vitest";
import {
  assertCanRun,
  assertFeature,
  creditsForMode,
  isUnlimited,
  RunNotAllowedError,
  type BillingContext,
} from "@/lib/billing/usage";
import { getPlan } from "@/lib/config/plans";

function ctx(planKey: string, credits: number): BillingContext {
  return { user: { id: "u1" }, planKey, plan: getPlan(planKey), credits };
}

describe("billing gates", () => {
  it("computes credits per mode and unlimited plans", () => {
    expect(creditsForMode("balanced")).toBe(1);
    expect(creditsForMode("premium")).toBe(3);
    expect(creditsForMode("weird")).toBe(1);
    expect(isUnlimited(getPlan("premium"))).toBe(true);
    expect(isUnlimited(getPlan("free"))).toBe(false);
  });

  it("blocks runs when out of credits (metered plan)", () => {
    expect(() => assertCanRun(ctx("free", 0), "balanced")).toThrowError(RunNotAllowedError);
    try {
      assertCanRun(ctx("free", 0), "balanced");
    } catch (e) {
      expect((e as RunNotAllowedError).code).toBe("insufficient_credits");
    }
  });

  it("allows runs with enough credits", () => {
    expect(() => assertCanRun(ctx("free", 3), "balanced")).not.toThrow();
  });

  it("gates premium mode behind the premium_model feature", () => {
    try {
      assertCanRun(ctx("free", 100), "premium");
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as RunNotAllowedError).code).toBe("premium_required");
    }
    expect(() => assertCanRun(ctx("premium", 0), "premium")).not.toThrow();
  });

  it("never charges credits on unlimited plans", () => {
    // premium is unlimited -> even 0 credits is allowed in any mode
    expect(() => assertCanRun(ctx("premium", 0), "balanced")).not.toThrow();
    expect(() => assertCanRun(ctx("team", 0), "premium")).not.toThrow();
  });

  it("gates add-on features", () => {
    expect(() => assertFeature(ctx("free", 100), "cover_letter")).toThrowError(RunNotAllowedError);
    expect(() => assertFeature(ctx("pro", 100), "cover_letter")).not.toThrow();
  });
});
