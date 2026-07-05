"use client";

import React, { useRef, useState } from "react";
import {
  Briefcase,
  FileText,
  Lock,
  MessageSquareText,
  Sparkles,
  Wand2,
} from "lucide-react";
import { DocumentInput } from "@/components/DocumentInput";
import { ResultsView } from "@/components/ResultsView";
import { Spinner, cx } from "@/components/ui";
import type { AnalysisResult } from "@/lib/types";
import {
  SAMPLE_INSTRUCTION,
  SAMPLE_JOB_DESCRIPTION,
  SAMPLE_RESUME,
} from "@/data/sample";

const LOADING_STEPS = [
  "Analyzing your instruction…",
  "Parsing the job description…",
  "Mapping your resume against the role…",
  "Scoring the current match…",
  "Tailoring your resume (truthfully)…",
  "Running the truthfulness check…",
];

export default function HomePage() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [instruction, setInstruction] = useState("");

  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const canSubmit =
    resume.trim().length >= 40 && jd.trim().length >= 40 && !loading;

  const loadSample = () => {
    setResume(SAMPLE_RESUME);
    setJd(SAMPLE_JOB_DESCRIPTION);
    setInstruction(SAMPLE_INSTRUCTION);
    setError(null);
  };

  const reset = () => {
    setResume("");
    setJd("");
    setInstruction("");
    setResult(null);
    setError(null);
  };

  const startStepAnimation = () => {
    setStepIndex(0);
    stepTimer.current = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, LOADING_STEPS.length - 1));
    }, 2500);
  };
  const stopStepAnimation = () => {
    if (stepTimer.current) clearInterval(stepTimer.current);
    stepTimer.current = null;
  };

  const analyze = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    startStepAnimation();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDescription: jd, instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data.result as AnalysisResult);
      setTimeout(
        () => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        100
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      stopStepAnimation();
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      {/* Header */}
      <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-card">
            <Wand2 size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              ResumeFit <span className="text-brand-600">AI</span>
            </h1>
            <p className="text-sm text-slate-500">
              Ethical, ATS-friendly resume tailoring — your real experience, at its best.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Sparkles size={15} /> Load sample data
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </header>

      {/* Three-input layout */}
      <section className="grid gap-4 lg:grid-cols-2">
        <DocumentInput
          kind="resume"
          label="Your Resume"
          placeholder="Paste your resume here, or upload a PDF / DOCX / TXT / Markdown file…"
          value={resume}
          onChange={setResume}
          icon={<FileText size={18} />}
        />
        <DocumentInput
          kind="jd"
          label="Job Description"
          placeholder="Paste the job description here, or upload a file…"
          value={jd}
          onChange={setJd}
          icon={<Briefcase size={18} />}
        />
      </section>

      {/* Instruction / chat input */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-brand-600">
            <MessageSquareText size={18} />
          </span>
          <h2 className="text-sm font-semibold text-slate-800">
            How should we tailor it? <span className="font-normal text-slate-400">(optional)</span>
          </h2>
        </div>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder='e.g. "Tailor this for a CIO role, make it more executive, emphasize AI & digital transformation, keep it to two pages, and export as a Word document."'
          className="min-h-[72px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            "Make it more executive-level",
            "Focus on AI & digital transformation",
            "Keep it under two pages",
            "Emphasize project management",
            "Export as a Word document",
          ].map((chip) => (
            <button
              key={chip}
              onClick={() =>
                setInstruction((prev) => (prev ? `${prev.trim()} ${chip}.` : `${chip}.`))
              }
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100"
            >
              + {chip}
            </button>
          ))}
        </div>
      </section>

      {/* Action bar */}
      <div className="mt-5 flex flex-col items-center gap-3">
        <button
          onClick={analyze}
          disabled={!canSubmit}
          className={cx(
            "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-card transition",
            canSubmit
              ? "bg-brand-600 hover:bg-brand-700"
              : "cursor-not-allowed bg-slate-300"
          )}
        >
          {loading ? <Spinner className="h-4 w-4" /> : <Wand2 size={16} />}
          {loading ? "Tailoring your resume…" : "Analyze & Tailor Resume"}
        </button>
        {!canSubmit && !loading ? (
          <p className="text-xs text-slate-400">
            Add both a resume and a job description (at least a few lines each) to continue.
          </p>
        ) : null}

        {/* Privacy note */}
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <Lock size={12} />
          Your data is processed in-session and is <strong>not stored</strong>. Resumes can
          contain sensitive personal information — only share what you&apos;re comfortable with.
        </p>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center gap-3">
            <Spinner className="h-5 w-5 text-brand-600" />
            <span className="text-sm font-medium text-slate-700">
              {LOADING_STEPS[stepIndex]}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {LOADING_STEPS.map((s, i) => (
              <div
                key={i}
                className={cx(
                  "flex items-center gap-2 text-xs",
                  i < stepIndex
                    ? "text-emerald-600"
                    : i === stepIndex
                    ? "text-slate-700"
                    : "text-slate-300"
                )}
              >
                <span
                  className={cx(
                    "h-1.5 w-1.5 rounded-full",
                    i < stepIndex
                      ? "bg-emerald-500"
                      : i === stepIndex
                      ? "bg-brand-500"
                      : "bg-slate-200"
                  )}
                />
                {s}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Error state */}
      {error && !loading ? (
        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          <strong>Couldn&apos;t complete tailoring.</strong>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {/* Results */}
      {result && !loading ? (
        <section ref={resultsRef} className="mt-10">
          <ResultsView result={result} />
        </section>
      ) : null}

      <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        ResumeFit AI · Built to help you present your real experience truthfully and
        effectively. Never fabricates skills, metrics, or credentials.
      </footer>
    </main>
  );
}
