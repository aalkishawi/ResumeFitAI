import { providerForTier } from "./router";
import { extractJson } from "./client";
import { addCall, emptyRunUsage, type RunUsage } from "./cost";
import type { Tier } from "./models";

// ---------------------------------------------------------------------------
// Single-call AI helper for add-on "career tools" (cover letter, LinkedIn,
// interview coach, recruiter review, ATS notes). Routes to a cost tier and
// returns the text plus tracked usage, so every feature shares one cheap,
// cost-aware path.
// ---------------------------------------------------------------------------

export interface AssistResult {
  text: string;
  usage: RunUsage;
}

export async function runAssist(params: {
  tier: Tier;
  system: string;
  user: string;
  maxTokens?: number;
  task: string;
}): Promise<AssistResult> {
  const provider = providerForTier(params.tier);
  const res = await provider.generateText({
    system: params.system,
    user: params.user,
    maxTokens: params.maxTokens ?? 2000,
    task: params.task,
  });
  const usage = emptyRunUsage();
  addCall(usage, {
    task: params.task,
    provider: res.provider,
    model: res.model,
    inputTokens: res.usage.inputTokens,
    outputTokens: res.usage.outputTokens,
    costUsd: res.costUsd,
  });
  return { text: res.text, usage };
}

/** Like runAssist but parses a JSON object from the response. */
export async function runAssistJson<T = unknown>(params: {
  tier: Tier;
  system: string;
  user: string;
  maxTokens?: number;
  task: string;
}): Promise<{ value: T; usage: RunUsage }> {
  const { text, usage } = await runAssist(params);
  return { value: extractJson(text) as T, usage };
}
