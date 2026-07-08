import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { SavedResult } from "@/components/history/SavedResult";
import type { AnalysisResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HistoryRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/signin?callbackUrl=/app/history/${id}`);

  const run = await prisma.resumeRun.findFirst({
    where: { id, userId: user.id },
  });
  if (!run || !run.resultJson) notFound();

  let result: AnalysisResult;
  try {
    result = JSON.parse(run.resultJson) as AnalysisResult;
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/app/history"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Back to history
        </Link>
        <span className="text-xs text-slate-400">
          {new Date(run.createdAt).toLocaleString()} · {run.mode} mode
        </span>
      </div>
      <h1 className="mb-6 text-xl font-bold tracking-tight text-slate-900">
        {run.title || "Tailored resume"}
      </h1>
      <SavedResult
        result={result}
        resume={run.resume ?? ""}
        jobDescription={run.jobDescription ?? ""}
      />
    </main>
  );
}
