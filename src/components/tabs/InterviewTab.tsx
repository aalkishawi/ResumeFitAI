import React from "react";
import { MessageCircleQuestion } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { Block } from "./shared";

export function InterviewTab({ result }: { result: AnalysisResult }) {
  const { interviewTalkingPoints } = result;

  return (
    <Block title={`Interview talking points (${interviewTalkingPoints.length})`}>
      <p className="mb-4 text-sm text-slate-500">
        Grounded in your tailored resume and the target role — use these to connect your
        real experience to what the employer is looking for.
      </p>
      {interviewTalkingPoints.length === 0 ? (
        <p className="text-sm text-slate-400">No talking points generated.</p>
      ) : (
        <div className="space-y-4">
          {interviewTalkingPoints.map((t, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-slate-800">{t.topic}</h4>
              {t.sampleQuestion ? (
                <p className="mt-1 flex items-start gap-1.5 text-sm text-brand-700">
                  <MessageCircleQuestion size={15} className="mt-0.5 shrink-0" />
                  <span className="italic">{t.sampleQuestion}</span>
                </p>
              ) : null}
              <p className="mt-2 text-sm text-slate-600">{t.point}</p>
            </div>
          ))}
        </div>
      )}
    </Block>
  );
}
