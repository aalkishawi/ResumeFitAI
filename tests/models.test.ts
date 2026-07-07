import { describe, it, expect, vi, afterEach } from "vitest";
import { activeProvider, modelForTier, openAiCompatConfig } from "@/lib/ai/models";

afterEach(() => vi.unstubAllEnvs());

describe("model configuration", () => {
  it("defaults the provider to anthropic", () => {
    vi.stubEnv("AI_PROVIDER", "");
    expect(activeProvider()).toBe("anthropic");
  });

  it("honors AI_PROVIDER", () => {
    vi.stubEnv("AI_PROVIDER", "groq");
    expect(activeProvider()).toBe("groq");
  });

  it("resolves sensible anthropic tier defaults", () => {
    vi.stubEnv("ECONOMY_MODEL", "");
    vi.stubEnv("PREMIUM_MODEL", "");
    expect(modelForTier("economy", "anthropic")).toBe("claude-haiku-4-5");
    expect(modelForTier("premium", "anthropic")).toBe("claude-opus-4-8");
  });

  it("honors an explicit ECONOMY_MODEL override", () => {
    vi.stubEnv("ECONOMY_MODEL", "gpt-4o-mini");
    expect(modelForTier("economy", "anthropic")).toBe("gpt-4o-mini");
  });

  it("builds the correct OpenAI-compatible base URLs", () => {
    expect(openAiCompatConfig("groq").baseUrl).toContain("groq.com");
    expect(openAiCompatConfig("gemini").baseUrl).toContain("generativelanguage.googleapis.com");
    expect(openAiCompatConfig("openai").baseUrl).toContain("api.openai.com");
  });
});
