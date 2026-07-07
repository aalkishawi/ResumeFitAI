import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserContext } from "@/lib/auth/session";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { creditPacks } from "@/lib/billing/catalog";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { PortalButton } from "@/components/billing/PortalButton";
import { TestingTools } from "@/components/dev/TestingTools";
import { PageHeader } from "@/components/PageHeader";
import { testUpgradeEnabled } from "@/lib/config/flags";
import { prisma } from "@/lib/db/client";

export const metadata = { title: "Billing — ResumeFit AI" };
export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await getUserContext();
  if (!ctx) redirect("/signin?callbackUrl=/billing");

  const { status } = await searchParams;
  const configured = isStripeConfigured();
  const sub = await prisma.subscription.findUnique({ where: { userId: ctx.user.id } });
  const hasCustomer = Boolean(sub?.stripeCustomerId);
  const packs = creditPacks();

  return (
    <>
      <PageHeader title="Billing & credits" subtitle="Manage your plan and top up credits." />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {status === "success" ? (
        <Banner tone="ok">Subscription updated — thank you! It may take a few seconds to reflect.</Banner>
      ) : status === "credits" ? (
        <Banner tone="ok">Credits added to your account. Thank you!</Banner>
      ) : status === "cancel" ? (
        <Banner tone="muted">Checkout canceled — no charge was made.</Banner>
      ) : null}

      {!configured ? (
        <Banner tone="muted">
          Billing isn&apos;t configured on this environment yet. Add your Stripe keys to enable
          checkout.
        </Banner>
      ) : null}

      {testUpgradeEnabled ? <TestingTools /> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Plan</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{ctx.plan.name}</div>
          <div className="mt-3 flex gap-2">
            <Link
              href="/pricing"
              className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {ctx.planKey === "free" ? "Upgrade" : "Change plan"}
            </Link>
            {configured && hasCustomer ? (
              <PortalButton className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" />
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Credits</div>
          <div className="mt-1 text-3xl font-bold text-slate-900">
            {ctx.plan.monthlyScans === -1 ? "∞" : ctx.credits}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            {ctx.plan.monthlyScans === -1 ? "Unlimited on your plan" : "Available to spend"}
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-800">Buy credit packs</h2>
      <p className="text-sm text-slate-500">One-time top-ups. 1 credit = 1 tailoring run (Premium mode = 3).</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {packs.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-card">
            <div className="text-lg font-bold text-slate-900">{p.credits}</div>
            <div className="text-xs text-slate-500">credits</div>
            <div className="mt-1 text-sm font-medium text-slate-700">
              ${(p.priceCents / 100).toFixed(2)}
            </div>
            {configured ? (
              <CheckoutButton
                pack={p.id}
                className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Buy
              </CheckoutButton>
            ) : (
              <button
                disabled
                className="mt-3 w-full cursor-not-allowed rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-400"
              >
                Unavailable
              </button>
            )}
          </div>
        ))}
      </div>
      </main>
    </>
  );
}

function Banner({ tone, children }: { tone: "ok" | "muted"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-600";
  return <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}
