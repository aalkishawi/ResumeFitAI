import { NextRequest } from "next/server";
import { handleTool, toolUserMessage } from "@/lib/tools/runTool";
import { runAssistJson } from "@/lib/ai/assist";
import { LINKEDIN_PROMPT } from "@/lib/prompts/linkedin";
import { clampLength, sanitizeText } from "@/lib/sanitize";
import type { LinkedInResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const str = (v: unknown, f = ""): string => (typeof v === "string" ? v : f);
const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => str(x)).filter((x) => x.trim().length > 0) : [];
const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

function normalize(raw: unknown): LinkedInResult {
  const r = rec(raw);
  return {
    headline: str(r.headline),
    about: str(r.about),
    experienceBullets: arr(r.experienceBullets),
    skills: arr(r.skills),
  };
}

export async function POST(req: NextRequest) {
  return handleTool(req, {
    feature: "linkedin",
    action: "linkedin",
    generate: async (input) => {
      const basis = clampLength(sanitizeText(input.tailoredResume || input.resume));
      const user = toolUserMessage(
        { ...input, jobDescription: clampLength(sanitizeText(input.jobDescription)) },
        basis
      );
      const { value, usage } = await runAssistJson({
        tier: "balanced",
        system: LINKEDIN_PROMPT,
        user,
        maxTokens: 2200,
        task: "linkedin",
      });
      return { payload: normalize(value), usage };
    },
  });
}
