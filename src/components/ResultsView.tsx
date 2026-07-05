"use client";

import React, { useState } from "react";
import {
  BarChart3,
  FileCheck2,
  KeyRound,
  ListChecks,
  MessagesSquare,
  Download,
} from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { cx } from "./ui";
import { AnalysisTab } from "./tabs/AnalysisTab";
import { TailoredResumeTab } from "./tabs/TailoredResumeTab";
import { KeywordGapsTab } from "./tabs/KeywordGapsTab";
import { ChangesTab } from "./tabs/ChangesTab";
import { InterviewTab } from "./tabs/InterviewTab";
import { ExportTab } from "./tabs/ExportTab";

type TabKey = "analysis" | "resume" | "keywords" | "changes" | "interview" | "export";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "analysis", label: "Analysis", icon: <BarChart3 size={16} /> },
  { key: "resume", label: "Tailored Resume", icon: <FileCheck2 size={16} /> },
  { key: "keywords", label: "Keyword Gaps", icon: <KeyRound size={16} /> },
  { key: "changes", label: "Changes Made", icon: <ListChecks size={16} /> },
  { key: "interview", label: "Interview Prep", icon: <MessagesSquare size={16} /> },
  { key: "export", label: "Export", icon: <Download size={16} /> },
];

export function ResultsView({ result }: { result: AnalysisResult }) {
  const [tab, setTab] = useState<TabKey>("analysis");
  const flagCount = result.unsupportedClaims.length;

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-1 mb-5 overflow-x-auto scroll-tidy bg-slate-50/80 px-1 py-2 backdrop-blur">
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cx(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition",
                tab === t.key
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              {t.icon}
              {t.label}
              {t.key === "resume" && flagCount > 0 ? (
                <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-semibold text-amber-950">
                  {flagCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div>
        {tab === "analysis" && <AnalysisTab result={result} />}
        {tab === "resume" && <TailoredResumeTab result={result} />}
        {tab === "keywords" && <KeywordGapsTab result={result} />}
        {tab === "changes" && <ChangesTab result={result} />}
        {tab === "interview" && <InterviewTab result={result} />}
        {tab === "export" && <ExportTab result={result} />}
      </div>
    </div>
  );
}
