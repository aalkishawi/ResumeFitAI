import { NextRequest } from "next/server";
import { handleTool, toolUserMessage } from "@/lib/tools/runTool";
import { runAssistJson } from "@/lib/ai/assist";
import { RECRUITER_REVIEW_PROMPT } from "@/lib/prompts/recruiter-review";
import { clampLength, sanitizeText } from "@/lib/sanitize";
import type { RecruiterReview } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const str = (v: unknown, f = ""): string => (typeof v === "string" ? v : f);
const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => str(x)).filter((x) => x.trim().length > 0) : [];
const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};
const score = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseInt(str(v, "0"), 10);
  return Number.isNaN(n) ? 0 : Math.max(0, Math.min(100, Math.round(n)));
};

function normalize(raw: unknown): RecruiterReview {
  const r = rec(raw);
  return {
    overallScore: score(r.overallScore),
    verdict: str(r.verdict),
    redFlags: arr(r.redFlags),
    unclearBullets: arr(r.unclearBullets),
    missing: arr(r.missing),
    strengths: arr(r.strengths),
  };
}

export async function POST(req: NextRequest) {
  return handleTool(req, {
    feature: "recruiter_review",
    action: "recruiter_review",
    generate: async (input) => {
      const basis = clampLength(sanitizeText(input.tailoredResume || input.resume));
      const user = toolUserMessage(
        { ...input, jobDescription: clampLength(sanitizeText(input.jobDescription)) },
        basis
      );
      const { value, usage } = await runAssistJson({
        tier: "balanced",
        system: RECRUITER_REVIEW_PROMPT,
        user,
        maxTokens: 2200,
        task: "recruiter_review",
      });
      return { payload: normalize(value), usage };
    },
  });
}
