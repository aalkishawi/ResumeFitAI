// ---------------------------------------------------------------------------
// Cost + token-usage accounting. Pure helpers plus a lightweight in-memory
// usage log. The log is process-local (fine for a single server / local dev);
// swap the store for a DB table when persistence is needed — see UsageLog in
// src/lib/db/models.ts.
// ---------------------------------------------------------------------------

import { MODEL_PRICING } from "./models";
import type { TokenUsage } from "./providers/types";

/**
 * Rough token estimate (~4 chars/token) for pre-flight budgeting and for
 * providers that don't return usage. Not exact, but good enough to log cost and
 * enforce guardrails. Anthropic responses report real usage.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/** USD cost for a token count on a given model (0 for unpriced/local models). */
export function priceFor(model: string, usage: TokenUsage): number {
  const p = MODEL_PRICING[model];
  if (!p) return 0;
  return (
    (usage.inputTokens / 1_000_000) * p.input +
    (usage.outputTokens / 1_000_000) * p.output
  );
}

export interface CallLog {
  task: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface RunUsage {
  calls: CallLog[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  cached: boolean;
}

export function emptyRunUsage(): RunUsage {
  return { calls: [], inputTokens: 0, outputTokens: 0, costUsd: 0, cached: false };
}

/** Accumulate one AI call into a run's usage total. */
export function addCall(run: RunUsage, call: CallLog): void {
  run.calls.push(call);
  run.inputTokens += call.inputTokens;
  run.outputTokens += call.outputTokens;
  run.costUsd += call.costUsd;
}

// --- process-local usage log ------------------------------------------------

export interface RunRecord extends RunUsage {
  id: string;
  mode: string;
  at: number; // epoch ms
}

const MAX_RECORDS = 500;
const runLog: RunRecord[] = [];
let seq = 0;

export function recordRun(usage: RunUsage, mode: string, at: number): RunRecord {
  const record: RunRecord = { ...usage, id: `run_${++seq}`, mode, at };
  runLog.unshift(record);
  if (runLog.length > MAX_RECORDS) runLog.length = MAX_RECORDS;
  return record;
}

export function getRunLog(limit = 100): RunRecord[] {
  return runLog.slice(0, limit);
}

export function getUsageSummary(): {
  runs: number;
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgCostPerRun: number;
  byModel: Record<string, { calls: number; costUsd: number }>;
} {
  const byModel: Record<string, { calls: number; costUsd: number }> = {};
  let totalCostUsd = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  for (const r of runLog) {
    totalCostUsd += r.costUsd;
    totalInputTokens += r.inputTokens;
    totalOutputTokens += r.outputTokens;
    for (const c of r.calls) {
      const m = (byModel[c.model] ||= { calls: 0, costUsd: 0 });
      m.calls += 1;
      m.costUsd += c.costUsd;
    }
  }
  return {
    runs: runLog.length,
    totalCostUsd,
    totalInputTokens,
    totalOutputTokens,
    avgCostPerRun: runLog.length ? totalCostUsd / runLog.length : 0,
    byModel,
  };
}
