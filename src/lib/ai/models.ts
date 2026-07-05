// ---------------------------------------------------------------------------
// Central model & provider configuration.
//
// This is the ONE place to change which provider/model each cost tier uses.
// Everything is env-driven so deployments can retune cost/quality without code
// changes. Nothing here calls the network — it only resolves configuration.
// ---------------------------------------------------------------------------

export type ProviderId =
  | "anthropic"
  | "openai"
  | "gemini"
  | "groq"
  | "ollama"
  | "vllm";

export type Tier = "economy" | "balanced" | "premium" | "local";

/** User-facing quality/cost modes selected in the UI. */
export type Mode = "economy" | "balanced" | "premium" | "local";

export const MODES: Mode[] = ["economy", "balanced", "premium", "local"];

/**
 * Approximate USD price per 1M tokens, by model id. Used for cost *estimates*
 * and logging only — keep it roughly current, it does not affect billing.
 * Unknown models (e.g. self-hosted local models) resolve to 0.
 * Update from each provider's pricing page as needed.
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic (per 1M tokens)
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-sonnet-4-5": { input: 3, output: 15 },
  // OpenAI
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  // Google Gemini (OpenAI-compatible endpoint)
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "gemini-1.5-pro": { input: 1.25, output: 5 },
  // Groq (very cheap hosted open models)
  "llama-3.3-70b-versatile": { input: 0.59, output: 0.79 },
  "llama-3.1-8b-instant": { input: 0.05, output: 0.08 },
  // Local models (Ollama / vLLM) — self-hosted, no per-token cost
  // (any model id not in this table is treated as free)
};

const env = (k: string): string | undefined => {
  const v = process.env[k];
  return v && v.trim() ? v.trim() : undefined;
};

/** The active provider for cloud tiers (economy/balanced/premium). */
export function activeProvider(): ProviderId {
  const p = (env("AI_PROVIDER") || "anthropic").toLowerCase();
  const allowed: ProviderId[] = ["anthropic", "openai", "gemini", "groq", "ollama", "vllm"];
  return (allowed as string[]).includes(p) ? (p as ProviderId) : "anthropic";
}

/** The provider used for Local Mode. Defaults to ollama, or vllm if only that is set. */
export function localProvider(): ProviderId {
  if (env("OLLAMA_BASE_URL")) return "ollama";
  if (env("VLLM_BASE_URL")) return "vllm";
  return "ollama";
}

/** Sensible default model per provider when a tier model isn't set. */
function providerDefaultModel(provider: ProviderId): string {
  switch (provider) {
    case "anthropic":
      return env("RESUMEFIT_MODEL") || "claude-sonnet-5";
    case "openai":
      return "gpt-4o-mini";
    case "gemini":
      return "gemini-2.0-flash";
    case "groq":
      return "llama-3.3-70b-versatile";
    case "ollama":
    case "vllm":
      return "llama3.1";
  }
}

/**
 * Resolve the model id for a tier. Precedence: tier-specific env var, then a
 * provider-appropriate default. Balanced also honours the legacy DEFAULT_MODEL
 * / RESUMEFIT_MODEL for backward compatibility.
 */
export function modelForTier(tier: Tier, provider: ProviderId): string {
  switch (tier) {
    case "economy":
      return (
        env("ECONOMY_MODEL") ||
        (provider === "anthropic" ? "claude-haiku-4-5" : providerDefaultModel(provider))
      );
    case "balanced":
      return env("BALANCED_MODEL") || env("DEFAULT_MODEL") || providerDefaultModel(provider);
    case "premium":
      return (
        env("PREMIUM_MODEL") ||
        (provider === "anthropic" ? "claude-opus-4-8" : providerDefaultModel(provider))
      );
    case "local":
      return env("LOCAL_MODEL") || providerDefaultModel(provider);
  }
}

/** Base URL + API key for an OpenAI-compatible provider. */
export function openAiCompatConfig(provider: ProviderId): {
  baseUrl: string;
  apiKey: string;
} {
  switch (provider) {
    case "openai":
      return {
        baseUrl: env("OPENAI_BASE_URL") || "https://api.openai.com/v1",
        apiKey: env("OPENAI_API_KEY") || "",
      };
    case "gemini":
      return {
        baseUrl:
          env("GEMINI_BASE_URL") ||
          "https://generativelanguage.googleapis.com/v1beta/openai",
        apiKey: env("GEMINI_API_KEY") || "",
      };
    case "groq":
      return {
        baseUrl: env("GROQ_BASE_URL") || "https://api.groq.com/openai/v1",
        apiKey: env("GROQ_API_KEY") || "",
      };
    case "ollama": {
      const base = env("OLLAMA_BASE_URL") || "http://localhost:11434";
      return { baseUrl: base.replace(/\/$/, "") + "/v1", apiKey: "ollama" };
    }
    case "vllm":
      return {
        baseUrl: env("VLLM_BASE_URL") || "http://localhost:8000/v1",
        apiKey: env("VLLM_API_KEY") || "not-needed",
      };
    default:
      // anthropic is not OpenAI-compatible; callers must not hit this.
      return { baseUrl: "", apiKey: "" };
  }
}

/** Cost thresholds and feature toggles read from env. */
export const runtimeConfig = {
  maxCostPerRun: Number(env("MAX_COST_PER_RUN") || 0.5),
  maxInputTokensPerTask: Number(env("MAX_INPUT_TOKENS_PER_TASK") || 20000),
  maxOutputTokensPerTask: Number(env("MAX_OUTPUT_TOKENS_PER_TASK") || 8000),
  costLogging: (env("ENABLE_COST_LOGGING") || "true") !== "false",
  responseCache: (env("ENABLE_RESPONSE_CACHE") || "true") !== "false",
  adminToken: env("ADMIN_TOKEN"),
};
