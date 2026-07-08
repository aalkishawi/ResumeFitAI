import { NextRequest } from "next/server";
import { handleTool, toolUserMessage } from "@/lib/tools/runTool";
import { runAssistJson } from "@/lib/ai/assist";
import { ATS_CHECKER_PROMPT } from "@/lib/prompts/ats-checker";
import { atsSignals } from "@/lib/tools/ats-scan";
import { clampLength, sanitizeText } from "@/lib/sanitize";
import type { AtsCheckResult } from "@/lib/types";

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
const validSeverity = new Set(["high", "medium", "low"]);

function normalize(raw: unknown): AtsCheckResult {
  const r = rec(raw);
  const issues = Array.isArray(r.issues)
    ? r.issues
        .map((i) => {
          const x = rec(i);
          const sev = str(x.severity, "medium").toLowerCase();
          return {
            severity: validSeverity.has(sev) ? sev : "medium",
            label: str(x.label),
            detail: str(x.detail),
          };
        })
        .filter((i) => i.label.trim().length > 0)
    : [];
  return { score: score(r.score), issues, recommendations: arr(r.recommendations) };
}

export async function POST(req: NextRequest) {
  return handleTool(req, {
    feature: "ats_checker",
    action: "ats_checker",
    // ATS assessment is mechanical — route to the cheaper economy tier.
    generate: async (input) => {
      // Analyze the actual resume the user provided (not the tailored version).
      const resumeText = clampLength(sanitizeText(input.resume));
      const signals = atsSignals(resumeText);
      const user =
        toolUserMessage(
          { ...input, jobDescription: clampLength(sanitizeText(input.jobDescription)) },
          resumeText
        ) +
        "\n\n=== AUTOMATED SIGNALS DETECTED ===\n" +
        (signals.length ? signals.map((s) => `- ${s}`).join("\n") : "None detected.");
      const { value, usage } = await runAssistJson({
        tier: "economy",
        system: ATS_CHECKER_PROMPT,
        user,
        maxTokens: 1800,
        task: "ats_checker",
      });
      return { payload: normalize(value), usage };
    },
  });
}
