// ---------------------------------------------------------------------------
// Prompt composition. The individual stage prompts live in their own files
// (per the design requirement). Here we compose them into the two system
// prompts that drive the two-call pipeline:
//
//   Call 1 (ANALYZE): instruction + JD + resume analysis + before-score.
//   Call 2 (TAILOR):  tailoring + truthfulness + interview + after-score.
//
// Keeping stages grouped into two calls keeps latency and cost reasonable while
// still honoring the "separate prompt per concern" requirement.
// ---------------------------------------------------------------------------

import { GUARDRAILS } from "./guardrails";
import { INSTRUCTION_ANALYSIS_PROMPT } from "./instruction-analysis";
import { JD_ANALYSIS_PROMPT } from "./jd-analysis";
import { RESUME_ANALYSIS_PROMPT } from "./resume-analysis";
import { MATCH_SCORING_PROMPT } from "./match-scoring";
import { TAILORING_PROMPT } from "./tailoring";
import { TRUTHFULNESS_VALIDATION_PROMPT } from "./truthfulness";
import { INTERVIEW_PROMPT } from "./interview";
import { EXPORT_FORMAT_PROMPT } from "./export-format";

const JSON_RULES = `# OUTPUT RULES
Respond with a SINGLE valid JSON object and nothing else. No markdown code
fences, no commentary before or after. All string arrays must be arrays (use []
when empty). All scores must be integers 0-100. Do not include any keys other
than those requested.`;

export const ANALYZE_SYSTEM_PROMPT = [
  GUARDRAILS,
  "You are performing the ANALYSIS phase of an ethical resume tailoring pipeline.",
  INSTRUCTION_ANALYSIS_PROMPT,
  JD_ANALYSIS_PROMPT,
  RESUME_ANALYSIS_PROMPT,
  MATCH_SCORING_PROMPT,
  `## Combined output shape
Return one JSON object with exactly these top-level keys:
{ "instruction": {...}, "jd": {...}, "resume": {...}, "scoreBefore": {...} }`,
  JSON_RULES,
].join("\n\n");

export const TAILOR_SYSTEM_PROMPT = [
  GUARDRAILS,
  "You are performing the TAILORING phase of an ethical resume tailoring pipeline. You are given the original inputs plus the structured analysis from the analysis phase.",
  TAILORING_PROMPT,
  EXPORT_FORMAT_PROMPT,
  TRUTHFULNESS_VALIDATION_PROMPT,
  INTERVIEW_PROMPT,
  `# OUTPUT FORMAT
Return your response in EXACTLY this structure, with nothing before, between,
or after the marked blocks other than what is described:

===TAILORED_RESUME_START===
<the complete tailored resume as clean Markdown>
===TAILORED_RESUME_END===
===JSON_START===
<a single JSON object with the metadata keys listed below>
===JSON_END===

Put the tailored resume ONLY between the resume markers as plain Markdown — do
NOT wrap it in quotes, do NOT escape it, and do NOT place it inside the JSON.

The block between ===JSON_START=== and ===JSON_END=== must be a SINGLE valid
JSON object with EXACTLY these keys (and NOT a "tailoredResume" key):
{
  "scoreAfter": {...},
  "changes": [...],
  "keywordGaps": [...],
  "missingSkillSuggestions": [...],
  "interviewTalkingPoints": [...],
  "unsupportedClaims": [...]
}

JSON rules for that block: no markdown code fences, no commentary. All string
arrays must be arrays (use [] when empty). All scores must be integers 0-100.
Do not include any keys other than those listed.`,
].join("\n\n");

/** Build the user message for the analysis call. */
export function buildAnalyzeUserPrompt(input: {
  resume: string;
  jobDescription: string;
  instruction: string;
}): string {
  return [
    "=== USER INSTRUCTION (may be empty) ===",
    input.instruction || "(none provided)",
    "",
    "=== JOB DESCRIPTION ===",
    input.jobDescription,
    "",
    "=== CANDIDATE RESUME (original — the ONLY source of truth) ===",
    input.resume,
  ].join("\n");
}

/** Build the user message for the tailoring call, including prior analysis. */
export function buildTailorUserPrompt(input: {
  resume: string;
  jobDescription: string;
  instruction: string;
  analysisJson: string;
}): string {
  return [
    "=== USER INSTRUCTION (may be empty) ===",
    input.instruction || "(none provided)",
    "",
    "=== JOB DESCRIPTION ===",
    input.jobDescription,
    "",
    "=== CANDIDATE RESUME (original — the ONLY source of truth) ===",
    input.resume,
    "",
    "=== STRUCTURED ANALYSIS (from the analysis phase) ===",
    input.analysisJson,
  ].join("\n");
}
