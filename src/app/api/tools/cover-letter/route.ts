import { NextRequest } from "next/server";
import { handleTool, toolUserMessage } from "@/lib/tools/runTool";
import { runAssist } from "@/lib/ai/assist";
import { COVER_LETTER_PROMPT } from "@/lib/prompts/cover-letter";
import { clampLength, sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return handleTool(req, {
    feature: "cover_letter",
    action: "cover_letter",
    generate: async (input) => {
      const basis = clampLength(sanitizeText(input.tailoredResume || input.resume));
      const user = toolUserMessage(
        { ...input, jobDescription: clampLength(sanitizeText(input.jobDescription)) },
        basis
      );
      const { text, usage } = await runAssist({
        tier: "balanced",
        system: COVER_LETTER_PROMPT,
        user,
        maxTokens: 1200,
        task: "cover_letter",
      });
      return { payload: { coverLetter: sanitizeText(text) }, usage };
    },
  });
}
