import { describe, it, expect } from "vitest";
import { analysisTier, tailoringTier } from "@/lib/ai/router";

describe("model routing", () => {
  it("routes analysis to a cheap tier", () => {
    expect(analysisTier("economy")).toBe("economy");
    expect(analysisTier("balanced")).toBe("economy");
    expect(analysisTier("premium")).toBe("balanced");
    expect(analysisTier("local")).toBe("local");
  });

  it("routes tailoring to the tier matching the user's mode", () => {
    expect(tailoringTier("economy")).toBe("economy");
    expect(tailoringTier("balanced")).toBe("balanced");
    expect(tailoringTier("premium")).toBe("premium");
    expect(tailoringTier("local")).toBe("local");
  });
});
