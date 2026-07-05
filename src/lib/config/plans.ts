// ---------------------------------------------------------------------------
// Plan catalog (source of truth). The seed script writes these into the Plan
// table; the app reads them here for gating and pricing display so the two
// never drift. `monthlyScans: -1` means unlimited.
//
// Feature keys are checked throughout the app to gate functionality. Keep this
// list and the FeatureKey union in sync.
// ---------------------------------------------------------------------------

export type FeatureKey =
  | "tailoring"
  | "pdf_export"
  | "docx_export"
  | "cover_letter"
  | "linkedin"
  | "interview"
  | "recruiter_review"
  | "ats_checker"
  | "versions"
  | "job_tracker"
  | "premium_model"
  | "executive_mode"
  | "advanced_interview"
  | "team_admin"
  | "white_label"
  | "api_access";

export type PlanKey = "free" | "basic" | "pro" | "premium" | "team";

export interface PlanDef {
  key: PlanKey;
  name: string;
  priceMonthlyCents: number;
  monthlyScans: number; // -1 = unlimited
  monthlyCredits: number;
  features: FeatureKey[];
  sortOrder: number;
  /** Short marketing blurb for the pricing page. */
  tagline: string;
}

export const PLAN_DEFS: PlanDef[] = [
  {
    key: "free",
    name: "Free",
    priceMonthlyCents: 0,
    monthlyScans: 3,
    monthlyCredits: 3,
    features: ["tailoring", "pdf_export"],
    sortOrder: 0,
    tagline: "Try it out — 3 tailored resumes a month.",
  },
  {
    key: "basic",
    name: "Basic",
    priceMonthlyCents: 900,
    monthlyScans: 30,
    monthlyCredits: 30,
    features: ["tailoring", "pdf_export", "interview"],
    sortOrder: 1,
    tagline: "For active job seekers.",
  },
  {
    key: "pro",
    name: "Pro",
    priceMonthlyCents: 1900,
    monthlyScans: 200,
    monthlyCredits: 200,
    features: [
      "tailoring",
      "pdf_export",
      "docx_export",
      "cover_letter",
      "linkedin",
      "interview",
      "ats_checker",
      "versions",
      "job_tracker",
    ],
    sortOrder: 2,
    tagline: "The complete job-application toolkit.",
  },
  {
    key: "premium",
    name: "Premium",
    priceMonthlyCents: 3900,
    monthlyScans: -1,
    monthlyCredits: 1000,
    features: [
      "tailoring",
      "pdf_export",
      "docx_export",
      "cover_letter",
      "linkedin",
      "interview",
      "ats_checker",
      "versions",
      "job_tracker",
      "premium_model",
      "executive_mode",
      "advanced_interview",
      "recruiter_review",
    ],
    sortOrder: 3,
    tagline: "Executive-grade rewriting and coaching.",
  },
  {
    key: "team",
    name: "Team / Institution",
    priceMonthlyCents: 9900,
    monthlyScans: -1,
    monthlyCredits: 5000,
    features: [
      "tailoring",
      "pdf_export",
      "docx_export",
      "cover_letter",
      "linkedin",
      "interview",
      "ats_checker",
      "versions",
      "job_tracker",
      "premium_model",
      "executive_mode",
      "advanced_interview",
      "recruiter_review",
      "team_admin",
      "white_label",
      "api_access",
    ],
    sortOrder: 4,
    tagline: "For universities, career centers, and agencies.",
  },
];

const byKey: Record<string, PlanDef> = Object.fromEntries(
  PLAN_DEFS.map((p) => [p.key, p])
);

export function getPlan(key: string): PlanDef {
  return byKey[key] ?? byKey.free;
}

export function planHasFeature(key: string, feature: FeatureKey): boolean {
  return getPlan(key).features.includes(feature);
}

/** Credits charged per run by mode (premium rewrites cost more). */
export const CREDITS_PER_RUN: Record<string, number> = {
  economy: 1,
  balanced: 1,
  premium: 3,
  local: 1,
};
