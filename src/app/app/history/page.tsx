import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { DeleteRunButton } from "@/components/history/DeleteRunButton";

export const metadata = { title: "History — ResumeFit AI" };
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?callbackUrl=/app/history");

  const runs = await prisma.resumeRun.findMany({
    where: { userId: user.id, resultJson: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      mode: true,
      scoreOverall: true,
      createdAt: true,
    },
  });

  return (
    <>
      <PageHeader title="Your history" subtitle="Every resume you've tailored, saved to your account.">
        <Link
          href="/app"
          className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-500"
        >
          New tailoring
        </Link>
      </PageHeader>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {runs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white dark:bg-white/[0.04] p-10 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
          <FileText size={28} className="mx-auto mb-3 text-slate-300" />
          No saved runs yet. Tailor a resume and it&apos;ll appear here.
        </div>
      ) : (
        <ul className="space-y-2">
          {runs.map((run) => (
            <li
              key={run.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-4 shadow-card dark:shadow-none"
            >
              <Link href={`/app/history/${run.id}`} className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {run.title || "Tailored resume"}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {new Date(run.createdAt).toLocaleString()} · {run.mode} mode · score{" "}
                  {run.scoreOverall}/100
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <Link
                  href={`/app/history/${run.id}`}
                  className="rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Open
                </Link>
                <DeleteRunButton id={run.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
      </main>
    </>
  );
}
