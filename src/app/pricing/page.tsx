import Link from "next/link";
import { Check } from "lucide-react";
import { PLAN_DEFS, type FeatureKey } from "@/lib/config/plans";
import { getUserContext } from "@/lib/auth/session";

export const metadata = { title: "Pricing — ResumeFit AI" };
export const dynamic = "force-dynamic";

const FEATURE_LABELS: Record<FeatureKey, string> = {
  tailoring: "AI resume tailoring",
  pdf_export: "PDF export",
  docx_export: "Word (DOCX) export",
  cover_letter: "Cover letter generator",
  linkedin: "LinkedIn optimizer",
  interview: "Interview prep",
  recruiter_review: "Recruiter review simulation",
  ats_checker: "ATS formatting checker",
  versions: "Multiple resume versions",
  job_tracker: "Job application tracker",
  premium_model: "Premium AI model",
  executive_mode: "Executive resume mode",
  advanced_interview: "Advanced interview coaching",
  team_admin: "Team admin dashboard",
  white_label: "White-label branding",
  api_access: "API access",
};

function price(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}`;
}

export default async function PricingPage() {
  const ctx = await getUserContext();
  const currentPlan = ctx?.planKey;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-slate-500">
          Improve ATS compatibility, job-description alignment, and interview readiness.
          Start free — upgrade when you need more.
        </p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3 xl:grid-cols-5">
        {PLAN_DEFS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const highlight = plan.key === "pro";
          return (
            <div
              key={plan.key}
              className={
                "flex flex-col rounded-2xl border bg-white p-5 shadow-card " +
                (highlight ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200")
              }
            >
              <div className="text-sm font-semibold text-slate-900">{plan.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">
                  {price(plan.priceMonthlyCents)}
                </span>
                {plan.priceMonthlyCents > 0 ? (
                  <span className="text-sm text-slate-400">/mo</span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">{plan.tagline}</p>
              <div className="mt-3 text-xs font-medium text-slate-600">
                {plan.monthlyScans === -1
                  ? "Unlimited resume scans"
                  : `${plan.monthlyScans} resume scans / month`}
              </div>

              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                    {FEATURE_LABELS[f]}
                  </li>
                ))}
              </ul>

              <Link
                href={ctx ? "/account" : "/signup"}
                className={
                  "mt-5 rounded-lg px-3.5 py-2 text-center text-sm font-semibold " +
                  (isCurrent
                    ? "cursor-default bg-slate-100 text-slate-400"
                    : highlight
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50")
                }
                aria-disabled={isCurrent}
              >
                {isCurrent ? "Current plan" : plan.priceMonthlyCents === 0 ? "Get started" : "Upgrade"}
              </Link>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        Billing checkout is coming soon. Prices shown are introductory.
      </p>
    </main>
  );
}
