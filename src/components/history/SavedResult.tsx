"use client";

import { ResultsView } from "@/components/ResultsView";
import type { AnalysisResult } from "@/lib/types";

export function SavedResult({
  result,
  resume,
  jobDescription,
}: {
  result: AnalysisResult;
  resume: string;
  jobDescription: string;
}) {
  return <ResultsView result={result} resume={resume} jobDescription={jobDescription} />;
}
