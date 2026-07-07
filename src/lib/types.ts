// ---------------------------------------------------------------------------
// Shared domain types used by both the API routes and the React frontend.
// These mirror the JSON contracts the AI pipeline is instructed to return.
// ---------------------------------------------------------------------------

export type OutputFormat = "docx" | "pdf" | "both" | "text" | "markdown";

export interface InstructionAnalysis {
  /** Requested tone, e.g. "executive", "professional but simple". */
  tone: string;
  /** Requested length, e.g. "one-page", "two-page", "concise", or "unspecified". */
  length: string;
  /** Target seniority level detected from the instruction. */
  seniority: string;
  /** Detected target role, if the user asked to tailor for a specific role. */
  targetRole: string;
  /** Emphasis areas the user asked to highlight. */
  emphasis: string[];
  /** Detected output format request. */
  outputFormat: OutputFormat | "unspecified";
  /** Plain-language interpretation of what the user asked for. */
  interpretation: string;
  /** Instructions that conflict with the truthfulness guardrails. */
  conflicts: string[];
}

export interface JDAnalysis {
  jobTitle: string;
  seniority: string;
  requiredSkills: string[];
  preferredSkills: string[];
  tools: string[];
  methodologies: string[];
  certifications: string[];
  responsibilities: string[];
  domainKeywords: string[];
  highPriorityKeywords: string[];
  qualificationThemes: string[];
}

export interface ResumeAnalysis {
  contact: string;
  summary: string;
  skills: string[];
  experience: string[];
  projects: string[];
  education: string[];
  certifications: string[];
  strengths: string[];
  missingKeywords: string[];
  irrelevantContent: string[];
  vagueBullets: string[];
  instructionAlignment: string[];
}

export interface ScoreBreakdown {
  overall: number;
  skills: number;
  experience: number;
  tools: number;
  keywordAlignment: number;
  seniorityAlignment: number;
  explanation: string;
  wellRepresented: string[];
  missingKeywords: string[];
  underusedKeywords: string[];
  instructionImpact: string;
}

export type KeywordStatus = "present" | "underused" | "missing";

export interface KeywordGap {
  keyword: string;
  status: KeywordStatus;
  suggestion: string;
}

export interface ChangeItem {
  section: string;
  change: string;
  rationale: string;
}

export interface UnsupportedClaim {
  claim: string;
  reason: string;
  ethicalAlternative: string;
}

export interface InterviewTalkingPoint {
  topic: string;
  point: string;
  sampleQuestion: string;
}

/** Per-call cost/token record surfaced to the client. */
export interface CallUsage {
  task: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

/** Aggregate cost/token usage for one analyze run. */
export interface RunUsageInfo {
  calls: CallUsage[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  cached: boolean;
  mode: string;
}

export interface InterviewQuestion {
  question: string;
  category: string;
  starAnswer: string;
}

export interface InterviewCoachResult {
  questions: InterviewQuestion[];
  whyThisRole: string;
  salaryTalkingPoints: string[];
}

/** Combined result returned by POST /api/analyze. */
export interface AnalysisResult {
  instruction: InstructionAnalysis;
  jd: JDAnalysis;
  resume: ResumeAnalysis;
  scoreBefore: ScoreBreakdown;
  scoreAfter: ScoreBreakdown;
  tailoredResume: string;
  changes: ChangeItem[];
  keywordGaps: KeywordGap[];
  missingSkillSuggestions: string[];
  interviewTalkingPoints: InterviewTalkingPoint[];
  unsupportedClaims: UnsupportedClaim[];
  /** Cost/model transparency for this run (optional; present when tracked). */
  usage?: RunUsageInfo;
}

export interface ExtractResult {
  filename: string;
  kind: "resume" | "jd";
  text: string;
  charCount: number;
  warnings: string[];
}
