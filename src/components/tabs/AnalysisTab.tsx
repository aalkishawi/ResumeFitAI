import React from "react";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { Card, ScoreBar, ScoreDonut } from "../ui";
import { Block, BulletList, ChipList, KeyValue } from "./shared";

export function AnalysisTab({ result }: { result: AnalysisResult }) {
  const { scoreBefore, scoreAfter, jd, resume, instruction } = result;
  const delta = scoreAfter.overall - scoreBefore.overall;

  return (
    <div className="space-y-5">
      {/* Score summary */}
      <Card className="p-6">
        <div className="grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
          <div className="flex items-center justify-center gap-6">
            <ScoreDonut score={scoreBefore.overall} label="Before" size={120} />
            <ArrowRight className="text-slate-300" size={28} />
            <ScoreDonut score={scoreAfter.overall} label="After (est.)" size={120} />
          </div>

          <div className="space-y-3">
            <ScoreBar label="Skills match" value={scoreAfter.skills} />
            <ScoreBar label="Experience match" value={scoreAfter.experience} />
            <ScoreBar label="Tools / technology" value={scoreAfter.tools} />
            <ScoreBar label="Keyword alignment" value={scoreAfter.keywordAlignment} />
            <ScoreBar label="Seniority alignment" value={scoreAfter.seniorityAlignment} />
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl bg-emerald-50 px-6 py-4 text-center">
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-600">
              Projected lift
            </span>
            <span className="text-3xl font-bold text-emerald-700">
              {delta >= 0 ? "+" : ""}
              {delta}
            </span>
            <span className="mt-1 max-w-[150px] text-xs text-emerald-600">
              from better presentation of your real experience
            </span>
          </div>
        </div>

        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          {scoreAfter.explanation || scoreBefore.explanation}
        </p>
      </Card>

      {/* Instruction interpretation */}
      <Block title="How your instruction shaped the tailoring">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KeyValue label="Target role" value={instruction.targetRole || jd.jobTitle} />
          <KeyValue label="Tone" value={instruction.tone} />
          <KeyValue label="Length" value={instruction.length} />
          <KeyValue label="Output format" value={instruction.outputFormat} />
        </div>
        {instruction.interpretation ? (
          <p className="mt-4 flex gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
            <Sparkles size={16} className="mt-0.5 shrink-0" />
            {instruction.interpretation}
          </p>
        ) : null}
        {instruction.emphasis.length > 0 ? (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Emphasis areas
            </p>
            <ChipList items={instruction.emphasis} tone="brand" />
          </div>
        ) : null}
        {instruction.conflicts.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <ShieldCheck size={14} /> Guardrails applied
            </p>
            <ul className="mt-1.5 list-disc pl-5 text-sm text-amber-800">
              {instruction.conflicts.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Block>

      {/* JD analysis */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Block title={`Job Description — ${jd.jobTitle}`}>
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                Seniority
              </p>
              <p className="text-sm text-slate-700">{jd.seniority}</p>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                Required skills
              </p>
              <ChipList items={jd.requiredSkills} tone="brand" />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                Preferred skills
              </p>
              <ChipList items={jd.preferredSkills} />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                Tools & technologies
              </p>
              <ChipList items={jd.tools} />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                High-priority keywords
              </p>
              <ChipList items={jd.highPriorityKeywords} tone="amber" />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                Key qualification themes
              </p>
              <BulletList items={jd.qualificationThemes} />
            </div>
          </div>
        </Block>

        {/* Resume analysis */}
        <Block title="Your Resume — strengths & gaps">
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-emerald-500">
                Current strengths
              </p>
              <BulletList items={resume.strengths} />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-rose-500">
                Missing / weak JD keywords
              </p>
              <ChipList items={resume.missingKeywords} tone="red" empty="Great coverage — nothing major missing." />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-amber-500">
                Vague bullets to strengthen
              </p>
              <BulletList items={resume.vagueBullets} empty="No obviously weak bullets found." />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                Possibly irrelevant to this JD
              </p>
              <BulletList items={resume.irrelevantContent} empty="Everything looks relevant." />
            </div>
          </div>
        </Block>
      </div>
    </div>
  );
}
