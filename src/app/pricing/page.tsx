import Link from "next/link";
import { Check } from "lucide-react";
import { PLAN_DEFS, type FeatureKey } from "@/lib/config/plans";
import { getUserContext } from "@/lib/auth/session";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { CheckoutButton } from "@/components/billing/CheckoutButton";

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
  const configured = isStripeConfigured();

  return (
    <div className="hero-glow min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, <span className="text-gradient">transparent</span> pricing
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Improve ATS compatibility, job-description alignment, and interview readiness. Start
            free — upgrade when you need more.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3 xl:grid-cols-5">
          {PLAN_DEFS.map((plan) => {
            const isCurrent = currentPlan === plan.key;
            const highlight = plan.key === "pro";
            const cls =
              "mt-5 block rounded-lg px-3.5 py-2 text-center text-sm font-semibold " +
              (isCurrent
                ? "cursor-default bg-white/5 text-slate-500"
                : highlight
                ? "bg-brand-600 text-white hover:bg-brand-500"
                : "border border-white/15 text-slate-100 hover:bg-white/10");
            return (
              <div
                key={plan.key}
                className={
                  "flex flex-col rounded-2xl p-5 " +
                  (highlight ? "glass ring-2 ring-brand-500/50" : "glass")
                }
              >
                <div className="text-sm font-semibold text-white">{plan.name}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {price(plan.priceMonthlyCents)}
                  </span>
                  {plan.priceMonthlyCents > 0 ? (
                    <span className="text-sm text-slate-400">/mo</span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-400">{plan.tagline}</p>
                <div className="mt-3 text-xs font-medium text-slate-300">
                  {plan.monthlyScans === -1
                    ? "Unlimited resume scans"
                    : `${plan.monthlyScans} resume scans / month`}
                </div>

                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                      {FEATURE_LABELS[f]}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <span className={cls}>Current plan</span>
                ) : plan.priceMonthlyCents === 0 ? (
                  <Link href={ctx ? "/app" : "/signup"} className={cls}>
                    Get started
                  </Link>
                ) : ctx && configured ? (
                  <CheckoutButton plan={plan.key} className={cls}>
                    Upgrade
                  </CheckoutButton>
                ) : (
                  <Link href={ctx ? "/billing" : "/signup"} className={cls}>
                    Upgrade
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Prices shown are introductory. Cancel anytime.
        </p>
      </main>
    </div>
  );
}
