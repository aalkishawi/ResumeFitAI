import { describe, it, expect } from "vitest";
import { atsSignals } from "@/lib/tools/ats-scan";

describe("ATS deterministic scan", () => {
  it("flags tab characters (column/table risk)", () => {
    const s = atsSignals("Name\tTitle");
    expect(s.some((x) => /tab/i.test(x))).toBe(true);
  });

  it("flags heavy pipe usage (tables)", () => {
    const s = atsSignals("a | b | c | d | e");
    expect(s.some((x) => /pipe/i.test(x))).toBe(true);
  });

  it("flags missing standard sections and email", () => {
    const s = atsSignals("Just a blob of text with no structure at all.");
    expect(s.some((x) => /experience/i.test(x))).toBe(true);
    expect(s.some((x) => /education/i.test(x))).toBe(true);
    expect(s.some((x) => /email/i.test(x))).toBe(true);
  });

  it("is quiet on a clean, well-structured resume", () => {
    const clean =
      "John Doe\njohn@example.com\n\nExperience\nSoftware Engineer at Acme.\n\nEducation\nBS Computer Science.\n\nSkills\nReact, Node.";
    const s = atsSignals(clean);
    expect(s.some((x) => /email/i.test(x))).toBe(false);
    expect(s.some((x) => /experience/i.test(x))).toBe(false);
  });
});
