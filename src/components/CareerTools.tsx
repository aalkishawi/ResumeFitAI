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
}

type ToolId = "cover_letter" | "interview" | "linkedin" | "recruiter" | "ats";

const TOOLS: {
  id: ToolId;
  feature: string;
  endpoint: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "cover_letter",
    feature: "cover_letter",
    endpoint: "/api/tools/cover-letter",
    title: "Cover Letter",
    desc: "A tailored, truthful cover letter for this role.",
    icon: <FileText size={16} />,
  },
  {
    id: "interview",
    feature: "interview",
    endpoint: "/api/tools/interview",
    title: "Interview Coach",
    desc: "Likely questions, STAR answers, and negotiation points.",
    icon: <MessagesSquare size={16} />,
  },
  {
    id: "linkedin",
    feature: "linkedin",
    endpoint: "/api/tools/linkedin",
    title: "LinkedIn Optimizer",
    desc: "Headline, About section, bullets, and skills.",
    icon: <Linkedin size={16} />,
  },
  {
    id: "recruiter",
    feature: "recruiter_review",
    endpoint: "/api/tools/recruiter",
    title: "Recruiter Review",
    desc: "A recruiter's honest take, red flags, and gaps.",
    icon: <ClipboardCheck size={16} />,
  },
  {
    id: "ats",
    feature: "ats_checker",
    endpoint: "/api/tools/ats",
    title: "ATS Checker",
    desc: "Formatting risks and ATS-safe fixes.",
    icon: <ScanSearch size={16} />,
  },
];

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
  const [errors, setErrors] = useState<
    Record<string, { msg: string; cta?: string } | undefined>
  >({});
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [interview, setInterview] = useState<InterviewCoachResult | null>(null);
  const [linkedin, setLinkedin] = useState<LinkedInResult | null>(null);
  const [recruiter, setRecruiter] = useState<RecruiterReview | null>(null);
  const [ats, setAts] = useState<AtsCheckResult | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ authenticated: false }));
  }, []);

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
            ? "/signin?callbackUrl=/"
            : undefined;
        setErrors((e) => ({ ...e, [tool.id]: { msg: data.error || "Something went wrong.", cta } }));
        return;
      }
      if (tool.id === "cover_letter") setCoverLetter(data.result.coverLetter);
      if (tool.id === "interview") setInterview(data.result as InterviewCoachResult);
      if (tool.id === "linkedin") setLinkedin(data.result as LinkedInResult);
      if (tool.id === "recruiter") setRecruiter(data.result as RecruiterReview);
      if (tool.id === "ats") setAts(data.result as AtsCheckResult);
      if (data.account && me) setMe({ ...me, ...data.account });
    } catch {
      setErrors((e) => ({ ...e, [tool.id]: { msg: "Network error. Please try again." } }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles size={18} className="text-brand-600" />
        <h3 className="text-sm font-semibold text-slate-800">Career tools</h3>
        {me?.authenticated && !me.unlimited ? (
          <span className="ml-auto text-xs text-slate-400">{me.credits} credits left</span>
        ) : null}
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Generate more from your resume &amp; this job — grounded in your real experience.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const locked = Boolean(me?.authenticated && !me.features?.includes(tool.feature));
          const err = errors[tool.id];
          return (
            <div key={tool.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-brand-600">{tool.icon}</span>
                <span className="text-sm font-semibold">{tool.title}</span>
                {locked ? <Lock size={12} className="text-slate-400" /> : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">{tool.desc}</p>

              {locked ? (
                <Link
                  href="/pricing"
                  className="mt-3 inline-block rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Upgrade to unlock
                </Link>
              ) : (
                <button
                  onClick={() => run(tool)}
                  disabled={busy !== null}
                  className={cx(
                    "mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white",
                    busy === tool.id ? "bg-brand-400" : "bg-brand-600 hover:bg-brand-700",
                    busy !== null && busy !== tool.id && "opacity-60"
                  )}
                >
                  {busy === tool.id ? <Spinner className="h-3 w-3" /> : null}
                  {busy === tool.id ? "Generating…" : "Generate (1 credit)"}
                </button>
              )}

              {err ? (
                <div className="mt-2 text-xs text-rose-600">
                  {err.msg}
                  {err.cta ? (
                    <Link href={err.cta} className="ml-1 font-semibold underline">
                      Fix
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {coverLetter ? (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Your cover letter</h4>
            <button
              onClick={() => navigator.clipboard.writeText(coverLetter)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50"
            >
              Copy
            </button>
          </div>
          <div className="prose prose-sm max-w-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{coverLetter}</ReactMarkdown>
          </div>
        </div>
      ) : null}

      {interview ? (
        <div className="mt-5 space-y-4">
          <h4 className="text-sm font-semibold text-slate-800">Interview prep</h4>
          {interview.whyThisRole ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Why this role
              </div>
              <p className="mt-1">{interview.whyThisRole}</p>
            </div>
          ) : null}
          {interview.questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase text-slate-500">
                  {q.category}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{q.starAnswer}</p>
            </div>
          ))}
          {interview.salaryTalkingPoints.length ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Salary negotiation points
              </div>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {interview.salaryTalkingPoints.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {linkedin ? (
        <div className="mt-5 space-y-3">
          <h4 className="text-sm font-semibold text-slate-800">LinkedIn optimization</h4>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Headline</div>
            <p className="mt-1 text-sm text-slate-700">{linkedin.headline}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">About</div>
            <div className="prose prose-sm mt-1 max-w-none text-slate-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{linkedin.about}</ReactMarkdown>
            </div>
          </div>
          {linkedin.experienceBullets.length ? (
            <ListCard title="Suggested experience bullets" items={linkedin.experienceBullets} />
          ) : null}
          {linkedin.skills.length ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Skills</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {linkedin.skills.map((s, i) => (
                  <span key={i} className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {recruiter ? (
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-semibold text-slate-800">Recruiter review</h4>
            <span
              className={cx(
                "rounded-full px-2.5 py-0.5 text-xs font-bold",
                recruiter.overallScore >= 75
                  ? "bg-emerald-100 text-emerald-700"
                  : recruiter.overallScore >= 50
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700"
              )}
            >
              {recruiter.overallScore}/100
            </span>
          </div>
          {recruiter.verdict ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {recruiter.verdict}
            </p>
          ) : null}
          {recruiter.strengths.length ? <ListCard title="Strengths" items={recruiter.strengths} tone="ok" /> : null}
          {recruiter.redFlags.length ? <ListCard title="Red flags" items={recruiter.redFlags} tone="bad" /> : null}
          {recruiter.unclearBullets.length ? <ListCard title="Unclear bullets" items={recruiter.unclearBullets} /> : null}
          {recruiter.missing.length ? <ListCard title="Missing / to strengthen" items={recruiter.missing} /> : null}
        </div>
      ) : null}

      {ats ? (
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-semibold text-slate-800">ATS check</h4>
            <span
              className={cx(
                "rounded-full px-2.5 py-0.5 text-xs font-bold",
                ats.score >= 75
                  ? "bg-emerald-100 text-emerald-700"
                  : ats.score >= 50
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700"
              )}
            >
              {ats.score}/100
            </span>
          </div>
          {ats.issues.length ? (
            <div className="space-y-2">
              {ats.issues.map((issue, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cx(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        issue.severity === "high"
                          ? "bg-rose-100 text-rose-700"
                          : issue.severity === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {issue.severity}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{issue.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{issue.detail}</p>
                </div>
              ))}
            </div>
          ) : null}
          {ats.recommendations.length ? <ListCard title="Recommendations" items={ats.recommendations} tone="ok" /> : null}
        </div>
      ) : null}
    </section>
  );
}

function ListCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "ok" | "bad";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</div>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
        {items.map((it, i) => (
          <li
            key={i}
            className={cx(
              tone === "ok" && "marker:text-emerald-500",
              tone === "bad" && "marker:text-rose-500"
            )}
          >
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
