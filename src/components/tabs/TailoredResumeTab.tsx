"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, ShieldAlert, ShieldCheck } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { Card } from "../ui";

export function TailoredResumeTab({ result }: { result: AnalysisResult }) {
  const [copied, setCopied] = useState(false);
  const claims = result.unsupportedClaims;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.tailoredResume);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be blocked; ignore */
    }
  };

  return (
    <div className="space-y-5">
      {/* Truthfulness guardrail status */}
      {claims.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <ShieldCheck size={18} className="shrink-0" />
          <span>
            <strong>Truthfulness check passed.</strong> Every claim in this resume is
            grounded in your original content — no fabricated skills, metrics, or credentials.
          </span>
        </div>
      ) : (
        <Card className="border-amber-200 bg-amber-50/60 p-5">
          <div className="mb-2 flex items-center gap-2 text-amber-800">
            <ShieldAlert size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Potentially Unsupported Claims ({claims.length})
            </h3>
          </div>
          <p className="mb-3 text-sm text-amber-800">
            These items were kept out of the resume (or flagged for your review) because
            they were not clearly supported by your original resume. Here is a truthful
            alternative for each.
          </p>
          <div className="space-y-3">
            {claims.map((c, i) => (
              <div key={i} className="rounded-xl border border-amber-200 bg-white p-3">
                <p className="text-sm font-medium text-slate-800">“{c.claim}”</p>
                <p className="mt-1 text-xs text-slate-500">
                  <strong>Why flagged:</strong> {c.reason}
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  <strong>Ethical alternative:</strong> {c.ethicalAlternative}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* The tailored resume */}
      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Tailored Resume</h3>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="resume-md scroll-tidy max-h-[70vh] overflow-y-auto px-8 py-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {result.tailoredResume || "_No resume was generated._"}
          </ReactMarkdown>
        </div>
      </Card>

      <p className="text-center text-xs text-slate-400">
        Head to the <strong>Export</strong> tab to download this as DOCX, PDF, TXT, or Markdown.
      </p>
    </div>
  );
}
