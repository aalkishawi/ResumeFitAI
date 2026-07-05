import { createHash } from "crypto";
import { PROMPT_VERSION } from "./version";
import { runtimeConfig } from "./models";
import type { AnalysisResult } from "@/lib/types";

// ---------------------------------------------------------------------------
// Response cache. Avoids paying for identical runs. Keyed by a hash of the
// inputs + mode + prompt version, so changing a prompt (via PROMPT_VERSION) or
// the inputs is a natural cache miss. Process-local with a TTL — swap for Redis
// or a DB table for multi-instance deployments.
// ---------------------------------------------------------------------------

interface Entry {
  value: AnalysisResult;
  expires: number;
}

const TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_ENTRIES = 200;
const store = new Map<string, Entry>();

export function cacheKey(input: {
  resume: string;
  jobDescription: string;
  instruction: string;
  mode: string;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        r: input.resume,
        j: input.jobDescription,
        i: input.instruction,
        m: input.mode,
        v: PROMPT_VERSION,
      })
    )
    .digest("hex");
}

export function getCached(key: string): AnalysisResult | null {
  if (!runtimeConfig.responseCache) return null;
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

export function setCached(key: string, value: AnalysisResult): void {
  if (!runtimeConfig.responseCache) return;
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(key, { value, expires: Date.now() + TTL_MS });
}
