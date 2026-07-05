import React from "react";
import { CheckCircle2, CircleDot, XCircle } from "lucide-react";
import type { AnalysisResult, KeywordStatus } from "@/lib/types";
import { Card } from "../ui";
import { Block, BulletList } from "./shared";

const STATUS_META: Record<
  KeywordStatus,
  { label: string; icon: React.ReactNode; row: string; chip: string }
> = {
  present: {
    label: "Well represented",
    icon: <CheckCircle2 size={16} className="text-emerald-600" />,
    row: "border-emerald-100 bg-emerald-50/40",
    chip: "text-emerald-700",
  },
  underused: {
    label: "Underused",
    icon: <CircleDot size={16} className="text-amber-600" />,
    row: "border-amber-100 bg-amber-50/40",
    chip: "text-amber-700",
  },
  missing: {
    label: "Missing",
    icon: <XCircle size={16} className="text-rose-600" />,
    row: "border-rose-100 bg-rose-50/40",
    chip: "text-rose-700",
  },
};

export function KeywordGapsTab({ result }: { result: AnalysisResult }) {
  const { keywordGaps, missingSkillSuggestions, scoreBefore } = result;

  const order: KeywordStatus[] = ["missing", "underused", "present"];
  const sorted = [...keywordGaps].sort(
    (a, b) => order.indexOf(a.status) - order.indexOf(b.status)
  );

  const counts = {
    present: keywordGaps.filter((k) => k.status === "present").length,
    underused: keywordGaps.filter((k) => k.status === "underused").length,
    missing: keywordGaps.filter((k) => k.status === "missing").length,
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {(["present", "underused", "missing"] as KeywordStatus[]).map((s) => (
          <Card key={s} className="flex items-center gap-3 p-4">
            {STATUS_META[s].icon}
            <div>
              <p className="text-2xl font-bold text-slate-800">{counts[s]}</p>
              <p className="text-xs text-slate-500">{STATUS_META[s].label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Block title="Keyword gap analysis">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-400">No keyword data available.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((k, i) => {
              const meta = STATUS_META[k.status];
              return (
                <div
                  key={i}
                  className={`flex flex-col gap-1 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between ${meta.row}`}
                >
                  <div className="flex items-center gap-2">
                    {meta.icon}
                    <span className="text-sm font-medium text-slate-800">{k.keyword}</span>
                    <span className={`text-xs font-semibold ${meta.chip}`}>
                      {meta.label}
                    </span>
                  </div>
                  {k.suggestion ? (
                    <span className="text-xs text-slate-500 sm:max-w-[55%] sm:text-right">
                      {k.suggestion}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Block>

      <div className="grid gap-5 lg:grid-cols-2">
        <Block title="Already represented well">
          <div className="flex flex-wrap gap-1.5">
            {scoreBefore.wellRepresented.length ? (
              scoreBefore.wellRepresented.map((w, i) => (
                <span
                  key={i}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                >
                  {w}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-400">None identified.</p>
            )}
          </div>
        </Block>

        <Block title="Skills you may want to learn">
          <p className="mb-2 text-xs text-slate-400">
            Suggestions to genuinely close remaining gaps — never added to your resume unless you earn them.
          </p>
          <BulletList
            items={missingSkillSuggestions}
            empty="No additional skills suggested — you're well matched."
          />
        </Block>
      </div>
    </div>
  );
}
