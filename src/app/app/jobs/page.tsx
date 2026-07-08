import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getUserContext } from "@/lib/auth/session";
import { planHasFeature } from "@/lib/config/plans";
import { prisma } from "@/lib/db/client";
import { JobTracker } from "@/components/jobs/JobTracker";

export const metadata = { title: "Job Tracker — ResumeFit AI" };
export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/signin?callbackUrl=/app/jobs");

  if (!planHasFeature(ctx.planKey, "job_tracker")) {
    return (
      <>
        <PageHeader title="Job Tracker" subtitle="Track every application in one place." />
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              The Job Application Tracker is a Pro feature.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
            >
              Upgrade to Pro
            </Link>
          </div>
        </main>
      </>
    );
  }

  const [jobsRaw, runsRaw] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.resumeRun.findMany({
      where: { userId: ctx.user.id, resultJson: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, title: true, createdAt: true },
    }),
  ]);

  const jobs = jobsRaw.map((j) => ({
    id: j.id,
    company: j.company,
    role: j.role,
    status: j.status,
    appliedAt: j.appliedAt ? j.appliedAt.toISOString() : null,
    url: j.url,
    notes: j.notes,
    resumeRunId: j.resumeRunId,
  }));
  const runs = runsRaw.map((r) => ({
    id: r.id,
    label: `${r.title || "Tailored resume"} · ${new Date(r.createdAt).toLocaleDateString()}`,
  }));

  return (
    <>
      <PageHeader title="Job Tracker" subtitle="Track every application, its status, and the resume version you used." />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <JobTracker initialJobs={jobs} runs={runs} />
      </main>
    </>
  );
}
