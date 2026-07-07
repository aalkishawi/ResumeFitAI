import { describe, it, expect } from "vitest";
import { extractJson } from "@/lib/ai/client";

describe("JSON extraction & repair", () => {
  it("parses clean JSON", () => {
    expect(extractJson('{"a":1,"b":"x"}')).toEqual({ a: 1, b: "x" });
  });

  it("strips code fences", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("recovers JSON embedded in prose", () => {
    expect(extractJson('Here you go: {"a":"b"} thanks!')).toEqual({ a: "b" });
  });

  it("repairs unescaped control characters inside strings (the resume-newline bug)", () => {
    const raw = '{"resume":"Line one\nLine two"}'; // literal newline inside the string
    const out = extractJson(raw) as { resume: string };
    expect(out.resume).toBe("Line one\nLine two");
  });

  it("throws on non-JSON", () => {
    expect(() => extractJson("definitely not json")).toThrow();
  });
});
