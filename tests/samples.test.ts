import { describe, it, expect } from "vitest";
import { SAMPLE_RESUMES, SAMPLE_JDS } from "@/data/samples";

describe("sample dataset", () => {
  it("covers multiple levels with substantial, unique docs", () => {
    expect(SAMPLE_RESUMES.length).toBeGreaterThanOrEqual(5);
    expect(SAMPLE_JDS.length).toBeGreaterThanOrEqual(3);

    for (const d of [...SAMPLE_RESUMES, ...SAMPLE_JDS]) {
      // Long enough to pass the app's 40-char minimum input validation.
      expect(d.text.trim().length).toBeGreaterThan(40);
      expect(d.label.length).toBeGreaterThan(0);
    }

    const ids = [...SAMPLE_RESUMES, ...SAMPLE_JDS].map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
