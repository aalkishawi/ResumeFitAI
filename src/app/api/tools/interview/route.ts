import { NextRequest } from "next/server";
import { handleTool, toolUserMessage } from "@/lib/tools/runTool";
import { runAssistJson } from "@/lib/ai/assist";
import { INTERVIEW_COACH_PROMPT } from "@/lib/prompts/interview-coach";
import { clampLength, sanitizeText } from "@/lib/sanitize";
import type { InterviewCoachResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const str = (v: unknown, f = ""): string => (typeof v === "string" ? v : f);
const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

function normalize(raw: unknown): InterviewCoachResult {
  const r = rec(raw);
  const questions = Array.isArray(r.questions)
    ? r.questions
        .map((q) => {
          const x = rec(q);
          return {
            question: str(x.question),
            category: str(x.category, "behavioral"),
            starAnswer: str(x.starAnswer),
          };
        })
        .filter((q) => q.question.trim().length > 0)
    : [];
  const salary = Array.isArray(r.salaryTalkingPoints)
    ? r.salaryTalkingPoints.map((s) => str(s)).filter((s) => s.trim().length > 0)
    : [];
  return { questions, whyThisRole: str(r.whyThisRole), salaryTalkingPoints: salary };
}

export async function POST(req: NextRequest) {
  return handleTool(req, {
    feature: "interview",
    action: "interview_coach",
    generate: async (input) => {
      const basis = clampLength(sanitizeText(input.tailoredResume || input.resume));
      const user = toolUserMessage(
        { ...input, jobDescription: clampLength(sanitizeText(input.jobDescription)) },
        basis
      );
      const { value, usage } = await runAssistJson({
        tier: "balanced",
        system: INTERVIEW_COACH_PROMPT,
        user,
        maxTokens: 2600,
        task: "interview_coach",
      });
      return { payload: normalize(value), usage };
    },
  });
}
