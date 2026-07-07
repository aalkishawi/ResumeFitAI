"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  MessagesSquare,
  Lock,
  Sparkles,
  Linkedin,
  ClipboardCheck,
  ScanSearch,
  Check,
  Copy,
  FileType2,
  FileDown,
} from "lucide-react";
import type {
  InterviewCoachResult,
  LinkedInResult,
  RecruiterReview,
  AtsCheckResult,
} from "@/lib/types";
import { Spinner, cx } from "./ui";

interface Me {
  authenticated: boolean;
  credits?: number;
  unlimited?: boolean;
  features?: string[];
  testMode?: boolean;
}

type ToolId = "cover_letter" | "interview" | "linkedin" | "recruiter" | "ats";
type Accent = "brand" | "violet" | "sky" | "amber" | "emerald";

const TOOLS: {
  id: ToolId;
  feature: string;
  endpoint: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  accent: Accent;
}[] = [
  { id: "cover_letter", feature: "cover_letter", endpoint: "/api/tools/cover-letter", title: "Cover Letter", desc: "A tailored, truthful cover letter.", icon: <FileText size={16} />, accent: "brand" },
  { id: "interview", feature: "interview", endpoint: "/api/tools/interview", title: "Interview Coach", desc: "Questions, STAR answers, salary points.", icon: <MessagesSquare size={16} />, accent: "violet" },
  { id: "linkedin", feature: "linkedin", endpoint: "/api/tools/linkedin", title: "LinkedIn Optimizer", desc: "Headline, About, bullets, skills.", icon: <Linkedin size={16} />, accent: "sky" },
  { id: "recruiter", feature: "recruiter_review", endpoint: "/api/tools/recruiter", title: "Recruiter Review", desc: "Honest take, red flags, gaps.", icon: <ClipboardCheck size={16} />, accent: "amber" },
  { id: "ats", feature: "ats_checker", endpoint: "/api/tools/ats", title: "ATS Checker", desc: "Formatting risks & fixes.", icon: <ScanSearch size={16} />, accent: "emerald" },
];

const ACCENT: Record<Accent, { active: string; bar: string; icon: string; dot: string }> = {
  brand: { active: "bg-brand-600 text-white", bar: "border-t-brand-500", icon: "text-brand-500", dot: "bg-brand-500" },
  violet: { active: "bg-violet-600 text-white", bar: "border-t-violet-500", icon: "text-violet-500", dot: "bg-violet-500" },
  sky: { active: "bg-sky-600 text-white", bar: "border-t-sky-500", icon: "text-sky-500", dot: "bg-sky-500" },
  amber: { active: "bg-amber-500 text-white", bar: "border-t-amber-500", icon: "text-amber-500", dot: "bg-amber-500" },
  emerald: { active: "bg-emerald-600 text-white", bar: "border-t-emerald-500", icon: "text-emerald-500", dot: "bg-emerald-500" },
};

async function downloadExport(content: string, format: "docx" | "pdf", filename: string) {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, format, filename }),
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const cd = res.headers.get("Content-Disposition") || "";
  a.download = cd.match(/filename="(.+?)"/)?.[1] || `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function CareerTools({
  resume,
  jobDescription,
  tailoredResume,
}: {
  resume: string;
  jobDescription: string;
  tailoredResume: string;
}) {
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState<ToolId | null>(null);
  const [errors, setErrors] = useState<Record<string, { msg: string; cta?: string } | undefined>>({});
  const [active, setActive] = useState<ToolId | null>(null);

  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [interview, setInterview] = useState<InterviewCoachResult | null>(null);
  const [linkedin, setLinkedin] = useState<LinkedInResult | null>(null);
  const [recruiter, setRecruiter] = useState<RecruiterReview | null>(null);
  const [ats, setAts] = useState<AtsCheckResult | null>(null);

  const loadMe = () => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ authenticated: false }));
  };
  useEffect(() => {
    loadMe();
    const onFocus = () => loadMe();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const unlockTest = async () => {
    await fetch("/api/dev/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "premium" }),
    }).catch(() => {});
    loadMe();
  };

  const has = (id: ToolId): boolean =>
    ({ cover_letter: !!coverLetter, interview: !!interview, linkedin: !!linkedin, recruiter: !!recruiter, ats: !!ats }[id]);

  const run = async (tool: (typeof TOOLS)[number]) => {
    setBusy(tool.id);
    setErrors((e) => ({ ...e, [tool.id]: undefined }));
    try {
      const res = await fetch(tool.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDescription, tailoredResume }),
      });
      const data = await res.json();
      if (!res.ok) {
        const cta =
          data.code === "insufficient_credits" || data.code === "feature_locked"
            ? "/pricing"
            : data.code === "auth_required"
            ? "/signin?callbackUrl=/app"
            : undefined;
        setErrors((e) => ({ ...e, [tool.id]: { msg: data.error || "Something went wrong.", cta } }));
        return;
      }
      if (tool.id === "cover_letter") setCoverLetter(data.result.coverLetter);
      if (tool.id === "interview") setInterview(data.result as InterviewCoachResult);
      if (tool.id === "linkedin") setLinkedin(data.result as LinkedInResult);
      if (tool.id === "recruiter") setRecruiter(data.result as RecruiterReview);
      if (tool.id === "ats") setAts(data.result as AtsCheckResult);
      setActive(tool.id);
      if (data.account && me) setMe({ ...me, ...data.account });
    } catch {
      setErrors((e) => ({ ...e, [tool.id]: { msg: "Network error. Please try again." } }));
    } finally {
      setBusy(null);
    }
  };

  const generated = TOOLS.filter((t) => has(t.id));
  const activeTool = TOOLS.find((t) => t.id === active) ?? null;

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles size={18} className="text-brand-600 dark:text-brand-400" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Career tools</h3>
        {me?.authenticated && !me.unlimited ? (
          <span className="ml-auto text-xs text-slate-400">{me.credits} credits left</span>
        ) : null}
      </div>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        Generate more from your resume &amp; this job — grounded in your real experience.
      </p>

      {me?.testMode && me.authenticated ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <span>🧪 Test mode — unlock every feature (Premium, unlimited) without paying.</span>
          <button onClick={unlockTest} className="rounded-lg bg-amber-500 px-2.5 py-1 font-semibold text-white hover:bg-amber-600">
            Unlock all (test)
          </button>
        </div>
      ) : null}

      {/* Launcher grid */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TOOLS.map((tool) => {
          const locked = Boolean(me?.authenticated && !me.features?.includes(tool.feature));
          const done = has(tool.id);
          const err = errors[tool.id];
          return (
            <div
              key={tool.id}
              className={cx(
                "rounded-xl border p-3",
                active === tool.id
                  ? "border-slate-300 dark:border-white/20"
                  : "border-slate-200 dark:border-white/10"
              )}
            >
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                <span className={ACCENT[tool.accent].icon}>{tool.icon}</span>
                <span className="text-sm font-semibold">{tool.title}</span>
                {done ? <span className={cx("ml-auto h-2 w-2 rounded-full", ACCENT[tool.accent].dot)} /> : null}
                {locked ? <Lock size={12} className="ml-auto text-slate-400" /> : null}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tool.desc}</p>

              {locked ? (
                <Link
                  href="/pricing"
                  target="_blank"
                  rel="noopener"
                  className="mt-3 inline-block rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  Upgrade to unlock
                </Link>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => run(tool)}
                    disabled={busy !== null}
                    className={cx(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white",
                      busy === tool.id ? "bg-slate-400" : "bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/20",
                      busy !== null && busy !== tool.id && "opacity-60"
                    )}
                  >
                    {busy === tool.id ? <Spinner className="h-3 w-3" /> : null}
                    {busy === tool.id ? "Generating…" : done ? "Regenerate" : "Generate (1 credit)"}
                  </button>
                  {done ? (
                    <button
                      onClick={() => setActive(tool.id)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                      View
                    </button>
                  ) : null}
                </div>
              )}

              {err ? (
                <div className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                  {err.msg}
                  {err.cta ? (
                    <Link href={err.cta} target="_blank" rel="noopener" className="ml-1 font-semibold underline">
                      Fix
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Result panel with per-tool tabs */}
      {generated.length > 0 && activeTool ? (
        <div className="mt-5">
          <div className="flex flex-wrap gap-1.5">
            {generated.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  active === t.id
                    ? ACCENT[t.accent].active
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                )}
              >
                {t.icon}
                {t.title}
              </button>
            ))}
          </div>

          <div
            className={cx(
              "mt-3 rounded-xl border-t-4 bg-white p-4 ring-1 ring-slate-200 dark:bg-white/[0.02] dark:ring-white/10",
              ACCENT[activeTool.accent].bar
            )}
          >
            {active === "cover_letter" && coverLetter ? <CoverLetterView text={coverLetter} /> : null}
            {active === "interview" && interview ? <InterviewView data={interview} /> : null}
            {active === "linkedin" && linkedin ? <LinkedInView data={linkedin} /> : null}
            {active === "recruiter" && recruiter ? <RecruiterView data={recruiter} /> : null}
            {active === "ats" && ats ? <AtsView data={ats} /> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

// --- Result renderers -------------------------------------------------------

function CoverLetterView({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };
  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10";
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Your cover letter</h4>
        <div className="flex items-center gap-2">
          <button onClick={copy} className={btn}>
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={() => downloadExport(text, "docx", "cover-letter")} className={btn}>
            <FileType2 size={13} /> DOCX
          </button>
          <button onClick={() => downloadExport(text, "pdf", "cover-letter")} className={btn}>
            <FileDown size={13} /> PDF
          </button>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 dark:border-white/10">
        <div className="prose prose-sm max-w-none leading-relaxed text-slate-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function InterviewView({ data }: { data: InterviewCoachResult }) {
  return (
    <div className="space-y-3">
      {data.whyThisRole ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Why this role</div>
          <p className="mt-1">{data.whyThisRole}</p>
        </div>
      ) : null}
      {data.questions.map((q, i) => (
        <div key={i} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{q.question}</p>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase text-slate-500 dark:bg-white/10 dark:text-slate-300">
              {q.category}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{q.starAnswer}</p>
        </div>
      ))}
      {data.salaryTalkingPoints.length ? (
        <ListCard title="Salary negotiation points" items={data.salaryTalkingPoints} />
      ) : null}
    </div>
  );
}

function LinkedInView({ data }: { data: LinkedInResult }) {
  return (
    <div className="space-y-3">
      <Field label="Headline" value={data.headline} />
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">About</div>
        <div className="prose prose-sm mt-1 max-w-none text-slate-700 dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.about}</ReactMarkdown>
        </div>
      </div>
      {data.experienceBullets.length ? <ListCard title="Suggested experience bullets" items={data.experienceBullets} /> : null}
      {data.skills.length ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Skills</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.skills.map((s, i) => (
              <span key={i} className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10">
                {s}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RecruiterView({ data }: { data: RecruiterReview }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recruiter review</h4>
        <ScoreChip score={data.overallScore} />
      </div>
      {data.verdict ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          {data.verdict}
        </p>
      ) : null}
      {data.strengths.length ? <ListCard title="Strengths" items={data.strengths} /> : null}
      {data.redFlags.length ? <ListCard title="Red flags" items={data.redFlags} /> : null}
      {data.unclearBullets.length ? <ListCard title="Unclear bullets" items={data.unclearBullets} /> : null}
      {data.missing.length ? <ListCard title="Missing / to strengthen" items={data.missing} /> : null}
    </div>
  );
}

function AtsView({ data }: { data: AtsCheckResult }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">ATS check</h4>
        <ScoreChip score={data.score} />
      </div>
      {data.issues.map((issue, i) => (
        <div key={i} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span
              className={cx(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                issue.severity === "high"
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                  : issue.severity === "medium"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                  : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"
              )}
            >
              {issue.severity}
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{issue.label}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{issue.detail}</p>
        </div>
      ))}
      {data.recommendations.length ? <ListCard title="Recommendations" items={data.recommendations} /> : null}
    </div>
  );
}

// --- small shared pieces ----------------------------------------------------

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

function ScoreChip({ score }: { score: number }) {
  return (
    <span
      className={cx(
        "rounded-full px-2.5 py-0.5 text-xs font-bold",
        score >= 75
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : score >= 50
          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
      )}
    >
      {score}/100
    </span>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</div>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
