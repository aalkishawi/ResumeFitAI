import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { getAdminStats } from "@/lib/admin/stats";
import {
  activeProvider,
  localProvider,
  modelForTier,
  runtimeConfig,
  MODEL_PRICING,
  type Mode,
} from "@/lib/ai/models";
import { analysisTier, tailoringTier } from "@/lib/ai/router";
import { featureFlags } from "@/lib/config/flags";
import { PROMPT_VERSION } from "@/lib/ai/version";

export const metadata = { title: "Admin — ResumeFit AI" };
export const dynamic = "force-dynamic";

const MODES: Mode[] = ["economy", "balanced", "premium", "local"];
const money = (n: number) => `$${n.toFixed(n < 1 ? 4 : 2)}`;

export default async function AdminPage() {
  if (!(await isCurrentUserAdmin())) redirect("/app");

  const stats = await getAdminStats();
  const provider = activeProvider();
  const local = localProvider();
  const tiers = {
    economy: modelForTier("economy", provider),
    balanced: modelForTier("balanced", provider),
    premium: modelForTier("premium", provider),
    local: modelForTier("local", local),
  };

  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="Cost, usage, model routing, and configuration." />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Total runs" value={String(stats.runCount)} />
          <Kpi label="Users" value={String(stats.userCount)} />
          <Kpi label="Total AI cost" value={money(stats.totalCost)} />
          <Kpi label="Avg cost / run" value={money(stats.avgCost)} />
        </div>

        {/* Cost by model */}
        <Card title="Cost by model">
          {stats.byModel.length === 0 ? (
            <Empty>No runs recorded yet.</Empty>
          ) : (
            <Table
              head={["Model", "Calls", "Input tok", "Output tok", "Cost"]}
              rows={stats.byModel.map((m) => [
                m.model,
                String(m.calls),
                m.inputTokens.toLocaleString(),
                m.outputTokens.toLocaleString(),
                money(m.costUsd),
              ])}
            />
          )}
          <p className="mt-3 text-xs text-slate-400">
            {stats.inputTokens.toLocaleString()} input / {stats.outputTokens.toLocaleString()} output
            tokens · {stats.creditsUsed} credits spent across all runs.
          </p>
        </Card>

        {/* Providers & tier models */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Providers & models">
            <dl className="space-y-2 text-sm">
              <Row k="Active cloud provider" v={provider} />
              <Row k="Local provider" v={local} />
              <Row k="Economy model" v={tiers.economy} />
              <Row k="Balanced model" v={tiers.balanced} />
              <Row k="Premium model" v={tiers.premium} />
              <Row k="Local model" v={tiers.local} />
            </dl>
          </Card>

          <Card title="Routing by mode">
            <Table
              head={["Mode", "Analysis", "Tailoring"]}
              rows={MODES.map((m) => [m, analysisTier(m), tailoringTier(m)])}
            />
            <p className="mt-3 text-xs text-slate-400">
              Analysis (JD/resume parsing, scoring, truthfulness, talking points) is batched into one
              call; tailoring is the resume rewrite.
            </p>
          </Card>
        </div>

        {/* Config */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Cost controls">
            <dl className="space-y-2 text-sm">
              <Row k="Max cost / run" v={money(runtimeConfig.maxCostPerRun)} />
              <Row k="Max input tokens / task" v={runtimeConfig.maxInputTokensPerTask.toLocaleString()} />
              <Row k="Max output tokens / task" v={runtimeConfig.maxOutputTokensPerTask.toLocaleString()} />
              <Row k="Cost logging" v={runtimeConfig.costLogging ? "on" : "off"} />
              <Row k="Response cache" v={runtimeConfig.responseCache ? "on" : "off"} />
              <Row k="Prompt version" v={`v${PROMPT_VERSION}`} />
            </dl>
          </Card>

          <Card title="Feature flags">
            <dl className="space-y-2 text-sm">
              {Object.entries(featureFlags).map(([k, v]) => (
                <Row key={k} k={k} v={v ? "enabled" : "disabled"} tone={v ? "ok" : "muted"} />
              ))}
            </dl>
          </Card>
        </div>

        {/* Recent runs */}
        <Card title="Recent runs">
          {stats.recent.length === 0 ? (
            <Empty>No runs yet.</Empty>
          ) : (
            <Table
              head={["When", "Title", "Mode", "Score", "Cost"]}
              rows={stats.recent.map((r) => [
                new Date(r.createdAt).toLocaleString(),
                r.title || "—",
                r.mode,
                `${r.scoreOverall}/100`,
                money(r.costUsd),
              ])}
            />
          )}
        </Card>

        {/* Pricing table */}
        <Card title="Model pricing (per 1M tokens, for cost estimates)">
          <Table
            head={["Model", "Input $", "Output $"]}
            rows={Object.entries(MODEL_PRICING).map(([m, p]) => [m, `$${p.input}`, `$${p.output}`])}
          />
        </Card>
      </main>
    </>
  );
}

// --- presentational bits ----------------------------------------------------

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "ok" | "muted" }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
      <dd
        className={
          "font-mono text-xs " +
          (tone === "ok"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "muted"
            ? "text-slate-400"
            : "text-slate-800 dark:text-slate-100")
        }
      >
        {v}
      </dd>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
            {head.map((h) => (
              <th key={h} className="px-2 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 dark:border-white/5">
              {r.map((c, j) => (
                <td key={j} className="px-2 py-2 text-slate-700 dark:text-slate-200">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}
