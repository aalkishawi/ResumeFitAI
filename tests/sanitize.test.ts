import { describe, it, expect } from "vitest";
import { sanitizeText, clampLength } from "@/lib/sanitize";

describe("sanitizeText", () => {
  it("normalizes smart punctuation and bullets to ASCII", () => {
    expect(sanitizeText("“hi”")).toBe('"hi"');
    expect(sanitizeText("‘hi’")).toBe("'hi'");
    expect(sanitizeText("• item")).toBe("- item");
    expect(sanitizeText("a – b")).toBe("a - b");
  });

  it("collapses excess whitespace", () => {
    expect(sanitizeText("a    b")).toBe("a b");
    expect(sanitizeText("a\n\n\n\nb")).toBe("a\n\nb");
  });
});

describe("clampLength", () => {
  it("leaves short input untouched", () => {
    expect(clampLength("short text")).toBe("short text");
  });
  it("truncates very long input with a marker", () => {
    const long = "x".repeat(30000);
    const out = clampLength(long);
    expect(out.length).toBeLessThan(long.length);
    expect(out).toContain("truncated");
  });
});
