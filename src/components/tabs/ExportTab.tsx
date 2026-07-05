"use client";

import React, { useState } from "react";
import { Check, Clipboard, FileType2, FileText, FileDown, Hash } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { Card, Spinner, cx } from "../ui";
import { Block } from "./shared";

type Fmt = "docx" | "pdf" | "txt" | "md";

const FORMATS: { key: Fmt; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: "docx", label: "Word (DOCX)", desc: "Best for most online applications", icon: <FileType2 size={20} /> },
  { key: "pdf", label: "PDF", desc: "Fixed layout, great for email & portfolios", icon: <FileDown size={20} /> },
  { key: "txt", label: "Plain text", desc: "Maximum ATS compatibility", icon: <FileText size={20} /> },
  { key: "md", label: "Markdown", desc: "Editable source format", icon: <Hash size={20} /> },
];

function deriveFilename(result: AnalysisResult): string {
  const name = result.resume.contact.split(/\n|,|\|/)[0]?.trim();
  const base = name && name.length > 1 ? name : "tailored-resume";
  return `${base} - ${result.jd.jobTitle}`.slice(0, 80);
}

export function ExportTab({ result }: { result: AnalysisResult }) {
  const [busy, setBusy] = useState<Fmt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const requested = result.instruction.outputFormat;
  const recommended: Fmt[] =
    requested === "docx"
      ? ["docx"]
      : requested === "pdf"
      ? ["pdf"]
      : requested === "both"
      ? ["docx", "pdf"]
      : ["docx", "pdf"];

  const download = async (format: Fmt) => {
    setBusy(format);
    setError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: result.tailoredResume,
          format,
          filename: deriveFilename(result),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Export failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="(.+?)"/);
      a.download = match?.[1] || `tailored-resume.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.tailoredResume);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-5">
      <Block title="Download your tailored resume">
        {requested !== "unspecified" ? (
          <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
            You asked for{" "}
            <strong>
              {requested === "both" ? "both DOCX and PDF" : requested.toUpperCase()}
            </strong>{" "}
            — those options are highlighted below.
          </p>
        ) : (
          <p className="mb-4 text-sm text-slate-500">
            No specific format was requested, so we recommend DOCX and PDF (both highlighted).
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {FORMATS.map((f) => {
            const isRec = recommended.includes(f.key);
            return (
              <button
                key={f.key}
                onClick={() => download(f.key)}
                disabled={busy !== null}
                className={cx(
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition disabled:opacity-60",
                  isRec
                    ? "border-brand-300 bg-brand-50/50 hover:bg-brand-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <span className={cx("shrink-0", isRec ? "text-brand-600" : "text-slate-500")}>
                  {busy === f.key ? <Spinner className="h-5 w-5" /> : f.icon}
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    {f.label}
                    {isRec ? (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-700">
                        Recommended
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-slate-500">{f.desc}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            {copied ? <Check size={15} /> : <Clipboard size={15} />}
            {copied ? "Copied to clipboard" : "Copy resume text"}
          </button>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
      </Block>

      <Card className="p-4">
        <p className="text-xs text-slate-500">
          All exports use a single-column, heading-and-bullet layout with a standard font —
          no tables, columns, images, or graphics — so they parse cleanly through applicant
          tracking systems.
        </p>
      </Card>
    </div>
  );
}
