import { describe, it, expect } from "vitest";
import { estimateTokens, priceFor, emptyRunUsage, addCall } from "@/lib/ai/cost";

describe("cost", () => {
  it("estimates tokens at ~4 chars/token", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("a".repeat(10))).toBe(3);
  });

  it("prices known models and returns 0 for unknown/local", () => {
    expect(priceFor("claude-haiku-4-5", { inputTokens: 1_000_000, outputTokens: 0 })).toBeCloseTo(1);
    expect(priceFor("claude-haiku-4-5", { inputTokens: 0, outputTokens: 1_000_000 })).toBeCloseTo(5);
    expect(priceFor("some-local-model", { inputTokens: 999999, outputTokens: 999999 })).toBe(0);
  });

  it("accumulates calls into a run total", () => {
    const run = emptyRunUsage();
    addCall(run, { task: "analysis", provider: "anthropic", model: "claude-haiku-4-5", inputTokens: 100, outputTokens: 50, costUsd: 0.001 });
    addCall(run, { task: "tailoring", provider: "anthropic", model: "claude-sonnet-5", inputTokens: 200, outputTokens: 300, costUsd: 0.005 });
    expect(run.calls).toHaveLength(2);
    expect(run.inputTokens).toBe(300);
    expect(run.outputTokens).toBe(350);
    expect(run.costUsd).toBeCloseTo(0.006);
  });
});
