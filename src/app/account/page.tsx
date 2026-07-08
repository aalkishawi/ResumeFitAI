import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { PrivacyControls } from "@/components/account/PrivacyControls";
import { getUserContext } from "@/lib/auth/session";

export const metadata = { title: "Account — ResumeFit AI" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/signin?callbackUrl=/account");

  return (
    <>
      <PageHeader title="Your account" subtitle={ctx.user.email ?? undefined} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Current plan
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{ctx.plan.name}</div>
          <div className="mt-1 text-sm text-slate-500">{ctx.plan.tagline}</div>
          <Link
            href="/billing"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {ctx.planKey === "free" ? "Upgrade plan" : "Billing & credits"}
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Credits
          </div>
          <div className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{ctx.credits}</div>
          <div className="mt-1 text-sm text-slate-500">
            {ctx.plan.monthlyScans === -1
              ? "Unlimited scans on your plan"
              : `${ctx.plan.monthlyScans} scans/month included`}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
          Privacy &amp; data
        </h2>
        <PrivacyControls initialSaveHistory={ctx.saveHistory} />
        <p className="mt-5 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
          Read our{" "}
          <Link href="/privacy" className="underline hover:text-brand-600">Privacy</Link>,{" "}
          <Link href="/terms" className="underline hover:text-brand-600">Terms</Link>, and{" "}
          <Link href="/ethics" className="underline hover:text-brand-600">Ethical use &amp; truthfulness</Link>{" "}
          policies.
        </p>
      </div>
      </main>
    </>
  );
}
