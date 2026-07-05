// ---------------------------------------------------------------------------
// Model router. Maps each pipeline stage to a cost tier based on the user's
// chosen mode, then resolves the tier to a concrete provider+model. This is the
// heart of cost control: cheap models for analysis, stronger models only where
// the user pays for quality (tailoring).
//
// Routing policy (per stage → tier):
//                economy mode   balanced mode   premium mode   local mode
//   analysis*    economy        economy         balanced       local
//   tailoring    economy        balanced        premium        local
//
//   *analysis = JD analysis, resume parsing, keyword/gap, match scoring,
//    truthfulness validation, interview points — all batched into one call.
// ---------------------------------------------------------------------------

import {
  activeProvider,
  localProvider,
  modelForTier,
  type Mode,
  type Tier,
} from "./models";
import { makeProvider } from "./providers";
import type { AiProvider } from "./providers/types";

export function analysisTier(mode: Mode): Tier {
  switch (mode) {
    case "economy":
    case "balanced":
      return "economy";
    case "premium":
      return "balanced";
    case "local":
      return "local";
  }
}

export function tailoringTier(mode: Mode): Tier {
  switch (mode) {
    case "economy":
      return "economy";
    case "balanced":
      return "balanced";
    case "premium":
      return "premium";
    case "local":
      return "local";
  }
}

/** Resolve a tier to a concrete provider instance. */
export function providerForTier(tier: Tier): AiProvider {
  if (tier === "local") {
    const p = localProvider();
    return makeProvider(p, modelForTier("local", p), true);
  }
  const p = activeProvider();
  const isLocal = p === "ollama" || p === "vllm";
  return makeProvider(p, modelForTier(tier, p), isLocal);
}

export function providerForAnalysis(mode: Mode): AiProvider {
  return providerForTier(analysisTier(mode));
}

export function providerForTailoring(mode: Mode): AiProvider {
  return providerForTier(tailoringTier(mode));
}
