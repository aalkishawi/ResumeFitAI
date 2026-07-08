"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { cx } from "../ui";

interface Job {
  id: string;
  company: string;
  role: string;
  status: string;
  appliedAt: string | null;
  url: string | null;
  notes: string | null;
  resumeRunId: string | null;
}
interface Run {
  id: string;
  label: string;
}

const STATUSES = ["saved", "applied", "interview", "offer", "rejected"] as const;

const STATUS_STYLE: Record<string, string> = {
  saved: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  applied: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  interview: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  offer: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

export function JobTracker({ initialJobs, runs }: { initialJobs: Job[]; runs: Run[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [url, setUrl] = useState("");
  const [resumeRunId, setResumeRunId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runLabel = (id: string | null) => runs.find((r) => r.id === id)?.label;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, url, resumeRunId: resumeRunId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add.");
        return;
      }
      const j = data.job;
      setJobs((prev) => [
        {
          id: j.id,
          company: j.company,
          role: j.role,
          status: j.status,
          appliedAt: j.appliedAt ?? null,
          url: j.url ?? null,
          notes: j.notes ?? null,
          resumeRunId: j.resumeRunId ?? null,
        },
        ...prev,
      ]);
      setCompany("");
      setRole("");
      setUrl("");
      setResumeRunId("");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
    await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, appliedAt: status !== "saved" ? new Date().toISOString() : null }),
    }).catch(() => {});
  };

  const del = async (id: string) => {
    if (!confirm("Delete this application?")) return;
    setJobs((prev) => prev.filter((j) => j.id !== id));
    await fetch(`/api/jobs/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const inputCls =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-brand-500/30";

  return (
    <div className="space-y-6">
      {/* Add form */}
      <form
        onSubmit={add}
        className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-5 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none"
      >
        <input className={inputCls} placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
        <input className={inputCls} placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
        <input className={inputCls} placeholder="Job URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
        <select className={inputCls} value={resumeRunId} onChange={(e) => setResumeRunId(e.target.value)}>
          <option value="">Resume version (optional)</option>
          {runs.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
        >
          <Plus size={15} /> Add
        </button>
        {error ? <p className="text-xs text-rose-500 lg:col-span-5">{error}</p> : null}
      </form>

      {/* List */}
      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-white/[0.02] dark:text-slate-400">
          No applications yet. Add your first one above.
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {j.role}
                  </span>
                  {j.url ? (
                    <a href={j.url} target="_blank" rel="noopener" className="text-slate-400 hover:text-brand-500">
                      <ExternalLink size={13} />
                    </a>
                  ) : null}
                </div>
                <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {j.company}
                  {j.appliedAt ? ` · applied ${new Date(j.appliedAt).toLocaleDateString()}` : ""}
                  {j.resumeRunId && runLabel(j.resumeRunId) ? (
                    <>
                      {" · "}
                      <Link href={`/app/history/${j.resumeRunId}`} className="underline hover:text-brand-500">
                        resume version
                      </Link>
                    </>
                  ) : null}
                </div>
              </div>

              <select
                value={j.status}
                onChange={(e) => setStatus(j.id, e.target.value)}
                className={cx(
                  "rounded-full border-0 px-3 py-1 text-xs font-semibold outline-none",
                  STATUS_STYLE[j.status] || STATUS_STYLE.saved
                )}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-white text-slate-700">
                    {s}
                  </option>
                ))}
              </select>

              <button
                onClick={() => del(j.id)}
                title="Delete"
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:hover:bg-rose-500/10"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
