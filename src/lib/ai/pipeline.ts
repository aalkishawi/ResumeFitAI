import { extractJson } from "./client";
import { providerForAnalysis, providerForTailoring } from "./router";
import { addCall, emptyRunUsage, recordRun } from "./cost";
import { runtimeConfig, type Mode } from "./models";
import { cacheKey, getCached, setCached } from "./cache";
import {
  ANALYZE_SYSTEM_PROMPT,
  TAILOR_SYSTEM_PROMPT,
  buildAnalyzeUserPrompt,
  buildTailorUserPrompt,
} from "@/lib/prompts";
import { clampLength, sanitizeText } from "@/lib/sanitize";
import type {
  AnalysisResult,
  ChangeItem,
  InstructionAnalysis,
  InterviewTalkingPoint,
  JDAnalysis,
  KeywordGap,
  ResumeAnalysis,
  ScoreBreakdown,
  UnsupportedClaim,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// The orchestration pipeline. Runs the two AI calls and normalizes the output
// so the frontend can rely on every field being present and well-typed.
// ---------------------------------------------------------------------------

/** Coerce an unknown value into a string-keyed record for safe property reads. */
const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

const asArray = <T>(v: unknown, map: (x: unknown) => T): T[] =>
  Array.isArray(v) ? v.map(map).filter((x) => x !== null && x !== undefined) : [];

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : v == null ? fallback : String(v);

const strArr = (v: unknown): string[] =>
  asArray<string>(v, (x) => str(x)).filter((s) => s.trim().length > 0);

const clampScore = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseInt(str(v, "0"), 10);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
};

function normalizeScore(input: unknown): ScoreBreakdown {
  const raw = rec(input);
  return {
    overall: clampScore(raw.overall),
    skills: clampScore(raw.skills),
    experience: clampScore(raw.experience),
    tools: clampScore(raw.tools),
    keywordAlignment: clampScore(raw.keywordAlignment),
    seniorityAlignment: clampScore(raw.seniorityAlignment),
    explanation: str(raw.explanation),
    wellRepresented: strArr(raw.wellRepresented),
    missingKeywords: strArr(raw.missingKeywords),
    underusedKeywords: strArr(raw.underusedKeywords),
    instructionImpact: str(raw.instructionImpact),
  };
}

function normalizeInstruction(input: unknown): InstructionAnalysis {
  const raw = rec(input);
  return {
    tone: str(raw.tone, "professional (default)"),
    length: str(raw.length, "unspecified"),
    seniority: str(raw.seniority, "unspecified"),
    targetRole: str(raw.targetRole),
    emphasis: strArr(raw.emphasis),
    outputFormat: (str(raw.outputFormat, "unspecified") as InstructionAnalysis["outputFormat"]),
    interpretation: str(raw.interpretation),
    conflicts: strArr(raw.conflicts),
  };
}

function normalizeJd(input: unknown): JDAnalysis {
  const raw = rec(input);
  return {
    jobTitle: str(raw.jobTitle, "Unknown role"),
    seniority: str(raw.seniority, "unspecified"),
    requiredSkills: strArr(raw.requiredSkills),
    preferredSkills: strArr(raw.preferredSkills),
    tools: strArr(raw.tools),
    methodologies: strArr(raw.methodologies),
    certifications: strArr(raw.certifications),
    responsibilities: strArr(raw.responsibilities),
    domainKeywords: strArr(raw.domainKeywords),
    highPriorityKeywords: strArr(raw.highPriorityKeywords),
    qualificationThemes: strArr(raw.qualificationThemes),
  };
}

function normalizeResume(input: unknown): ResumeAnalysis {
  const raw = rec(input);
  return {
    contact: str(raw.contact),
    summary: str(raw.summary),
    skills: strArr(raw.skills),
    experience: strArr(raw.experience),
    projects: strArr(raw.projects),
    education: strArr(raw.education),
    certifications: strArr(raw.certifications),
    strengths: strArr(raw.strengths),
    missingKeywords: strArr(raw.missingKeywords),
    irrelevantContent: strArr(raw.irrelevantContent),
    vagueBullets: strArr(raw.vagueBullets),
    instructionAlignment: strArr(raw.instructionAlignment),
  };
}

function normalizeChanges(raw: unknown): ChangeItem[] {
  return asArray<ChangeItem>(raw, (item) => {
    const x = rec(item);
    return {
      section: str(x.section, "General"),
      change: str(x.change),
      rationale: str(x.rationale),
    };
  }).filter((c) => c.change.trim().length > 0);
}

function normalizeKeywordGaps(raw: unknown): KeywordGap[] {
  const valid = new Set(["present", "underused", "missing"]);
  return asArray<KeywordGap>(raw, (item) => {
    const x = rec(item);
    const status = str(x.status, "missing").toLowerCase();
    return {
      keyword: str(x.keyword),
      status: (valid.has(status) ? status : "missing") as KeywordGap["status"],
      suggestion: str(x.suggestion),
    };
  }).filter((k) => k.keyword.trim().length > 0);
}

function normalizeTalkingPoints(raw: unknown): InterviewTalkingPoint[] {
  return asArray<InterviewTalkingPoint>(raw, (item) => {
    const x = rec(item);
    return {
      topic: str(x.topic, "Talking point"),
      point: str(x.point),
      sampleQuestion: str(x.sampleQuestion),
    };
  }).filter((t) => t.point.trim().length > 0);
}

function normalizeUnsupported(raw: unknown): UnsupportedClaim[] {
  return asArray<UnsupportedClaim>(raw, (item) => {
    const x = rec(item);
    return {
      claim: str(x.claim),
      reason: str(x.reason),
      ethicalAlternative: str(x.ethicalAlternative),
    };
  }).filter((u) => u.claim.trim().length > 0);
}

// ---------------------------------------------------------------------------
// Output correctness is enforced by (a) the system prompts, which demand a
// single JSON object of an exact shape, and (b) the resilient parser in
// client.ts (extractJson + escapeControlCharsInStrings), which repairs the
// common failure — literal newlines/control chars inside the markdown resume
// string — before parsing.
//
// We deliberately do NOT use the API's Structured Outputs (json_schema) here.
// The full analysis/tailoring shapes have too many free-form string fields;
// each expands into the JSON-string sub-grammar and the compiled
// constrained-decoding grammar exceeds the API's size limit, returning
// 400 "The compiled grammar is too large". Prompt + repair covers the same
// ground without that ceiling. The normalizers above still clamp/validate
// every field, so a stray extra key or wrong type can't reach the frontend.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tailoring response format. The tailored resume is a large free-form Markdown
// document; embedding it inside a JSON string is fragile because unescaped
// quotes/newlines in the resume break JSON.parse. Instead the model returns the
// resume as raw text between sentinels, and only the (small, structured)
// metadata as JSON — so the fragile part never has to be JSON-escaped.
// ---------------------------------------------------------------------------

const RESUME_START = "===TAILORED_RESUME_START===";
const RESUME_END = "===TAILORED_RESUME_END===";
const JSON_START = "===JSON_START===";
const JSON_END = "===JSON_END===";

/** Return the text between two markers, or null if either marker is missing. */
function sliceBetween(s: string, start: string, end: string): string | null {
  const i = s.indexOf(start);
  if (i === -1) return null;
  const j = s.indexOf(end, i + start.length);
  if (j === -1) return null;
  return s.slice(i + start.length, j).trim();
}

/**
 * Parse the tailoring response into the raw resume Markdown and the metadata
 * object. Prefers the sentinel format; falls back to the legacy single-JSON
 * shape (where `tailoredResume` was a key) if the markers aren't present.
 */
function parseTailorOutput(raw: string): {
  tailoredResume: string;
  meta: Record<string, unknown>;
} {
  const resume = sliceBetween(raw, RESUME_START, RESUME_END);
  const jsonBlock = sliceBetween(raw, JSON_START, JSON_END);
  if (resume !== null && jsonBlock !== null) {
    return { tailoredResume: resume, meta: rec(extractJson(jsonBlock)) };
  }
  // Fallback: whole response is one JSON object with a tailoredResume key.
  const obj = rec(extractJson(raw));
  return { tailoredResume: str(obj.tailoredResume), meta: obj };
}

export interface PipelineInput {
  resume: string;
  jobDescription: string;
  instruction: string;
  /** Cost/quality mode. Defaults to "balanced". */
  mode?: Mode;
}

/** Run the full analyze -> tailor pipeline and return a normalized result. */
export async function runPipeline(input: PipelineInput): Promise<AnalysisResult> {
  const mode: Mode = input.mode ?? "balanced";
  const resume = clampLength(sanitizeText(input.resume));
  const jobDescription = clampLength(sanitizeText(input.jobDescription));
  const instruction = sanitizeText(input.instruction);

  // ---- Cache: skip the whole pipeline for an identical prior run ----------
  const key = cacheKey({ resume, jobDescription, instruction, mode });
  const cached = getCached(key);
  if (cached) {
    return {
      ...cached,
      usage: cached.usage ? { ...cached.usage, cached: true } : undefined,
    };
  }

  const usage = emptyRunUsage();

  // ---- Call 1: analysis + before-score (routed to the economy tier) ------
  const analysisProvider = providerForAnalysis(mode);
  const analysisRes = await analysisProvider.generateText({
    system: ANALYZE_SYSTEM_PROMPT,
    user: buildAnalyzeUserPrompt({ resume, jobDescription, instruction }),
    maxTokens: 8000,
    task: "analysis",
  });
  addCall(usage, { task: "analysis", ...analysisRes.usage, ...pickMeta(analysisRes) });
  const analysisRaw = rec(extractJson(analysisRes.text));

  const instructionAnalysis = normalizeInstruction(analysisRaw.instruction);
  const jd = normalizeJd(analysisRaw.jd);
  const resumeAnalysis = normalizeResume(analysisRaw.resume);
  const scoreBefore = normalizeScore(analysisRaw.scoreBefore);

  // Compact analysis JSON handed to the tailoring call for grounding.
  const analysisJson = JSON.stringify({
    instruction: instructionAnalysis,
    jd,
    resume: resumeAnalysis,
    scoreBefore,
  });

  // ---- Call 2: tailoring (routed to balanced/premium by mode) ------------
  const tailoringProvider = providerForTailoring(mode);
  const tailorRes = await tailoringProvider.generateText({
    system: TAILOR_SYSTEM_PROMPT,
    user: buildTailorUserPrompt({ resume, jobDescription, instruction, analysisJson }),
    maxTokens: 32000,
    task: "tailoring",
  });
  addCall(usage, { task: "tailoring", ...tailorRes.usage, ...pickMeta(tailorRes) });

  const { tailoredResume: tailoredResumeRaw, meta: tailorRaw } =
    parseTailorOutput(tailorRes.text);

  const tailoredResume = sanitizeText(tailoredResumeRaw);
  const scoreAfter = normalizeScore(tailorRaw.scoreAfter);

  // ---- Cost accounting: log, warn on threshold, record -------------------
  recordRun(usage, mode, Date.now());
  if (runtimeConfig.costLogging) {
    console.log(
      `[cost] mode=${mode} $${usage.costUsd.toFixed(4)} ` +
        `in=${usage.inputTokens} out=${usage.outputTokens} ` +
        usage.calls.map((c) => `${c.task}:${c.model}`).join(" ")
    );
  }
  if (usage.costUsd > runtimeConfig.maxCostPerRun) {
    console.warn(
      `[cost] run exceeded MAX_COST_PER_RUN ($${usage.costUsd.toFixed(4)} > $${runtimeConfig.maxCostPerRun})`
    );
  }

  const result: AnalysisResult = {
    instruction: instructionAnalysis,
    jd,
    resume: resumeAnalysis,
    scoreBefore,
    scoreAfter,
    tailoredResume,
    changes: normalizeChanges(tailorRaw.changes),
    keywordGaps: normalizeKeywordGaps(tailorRaw.keywordGaps),
    missingSkillSuggestions: strArr(tailorRaw.missingSkillSuggestions),
    interviewTalkingPoints: normalizeTalkingPoints(tailorRaw.interviewTalkingPoints),
    unsupportedClaims: normalizeUnsupported(tailorRaw.unsupportedClaims),
    usage: { ...usage, mode },
  };

  setCached(key, result);
  return result;
}

/** Extract the provider/model/cost fields from a generate result for logging. */
function pickMeta(r: { provider: string; model: string; costUsd: number }) {
  return { provider: r.provider, model: r.model, costUsd: r.costUsd };
}
