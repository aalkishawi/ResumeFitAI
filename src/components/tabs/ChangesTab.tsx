import React from "react";
import { ArrowRightCircle } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { Block } from "./shared";

export function ChangesTab({ result }: { result: AnalysisResult }) {
  const { changes } = result;

  return (
    <Block title={`Changes made (${changes.length})`}>
      {changes.length === 0 ? (
        <p className="text-sm text-slate-400">No changes were recorded.</p>
      ) : (
        <ol className="space-y-3">
          {changes.map((c, i) => (
            <li key={i} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-1 flex items-center gap-2">
                <ArrowRightCircle size={16} className="text-brand-500" />
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  {c.section}
                </span>
              </div>
              <p className="text-sm text-slate-800">{c.change}</p>
              {c.rationale ? (
                <p className="mt-1 text-xs text-slate-500">
                  <strong>Why:</strong> {c.rationale}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </Block>
  );
}
