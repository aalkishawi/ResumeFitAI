import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Thin wrapper around the Anthropic SDK. The API key lives ONLY on the server
// (process.env) and is never sent to the client.
// ---------------------------------------------------------------------------

export const DEFAULT_MODEL = process.env.RESUMEFIT_MODEL || "claude-sonnet-5";

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key."
    );
    this.name = "MissingApiKeyError";
  }
}

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();
  if (!cachedClient) {
    cachedClient = new Anthropic({
      apiKey,
      // Retry transient network errors (connection resets / "Premature close",
      // 429, 5xx) with exponential backoff before giving up.
      maxRetries: 3,
      // Generous per-request timeout so long generations don't get cut off.
      timeout: 120_000,
    });
  }
  return cachedClient;
}

/** Translate low-level SDK/network errors into a clear, actionable message. */
export function describeApiError(err: unknown): string {
  if (err instanceof MissingApiKeyError) return err.message;

  const raw = err instanceof Error ? err.message : String(err);

  // undici/fetch connection drop — very common behind corporate proxies / VPNs
  // that perform TLS inspection, or on flaky networks.
  if (/premature close|ECONNRESET|ETIMEDOUT|fetch failed|Connection error|socket hang up/i.test(raw)) {
    return (
      "Couldn't reach the Anthropic API — the connection closed early. This is " +
      "usually a network issue (corporate proxy/VPN, firewall, or TLS inspection). " +
      "Try again, switch networks, or set an HTTPS_PROXY environment variable if " +
      "your network requires one."
    );
  }

  if (/401|invalid x-api-key|authentication/i.test(raw)) {
    return "Anthropic rejected the API key (401). Check ANTHROPIC_API_KEY in .env.local.";
  }
  // Only a genuine not-found / 404 that also mentions the model is a model-
  // availability problem. (The old check matched the bare word "model", so any
  // error mentioning "model" — including our own JSON-parse failure — was
  // misreported as an unavailable model.)
  if (/404|not_found/i.test(raw) && /model/i.test(raw)) {
    return `The configured model "${DEFAULT_MODEL}" wasn't found or isn't available on your account. Set RESUMEFIT_MODEL to a model you have access to.`;
  }
  // Response truncated because it hit the output token ceiling.
  if (/response was cut off|max_tokens/i.test(raw)) {
    return (
      "The AI response was cut off before it finished (hit the output token " +
      "limit). Try a shorter resume or job description, or increase the token " +
      "budget."
    );
  }
  if (/valid JSON/i.test(raw)) {
    return "The AI returned a malformed response that couldn't be parsed. Please try again.";
  }
  if (/429|rate.?limit|overloaded|529/i.test(raw)) {
    return "Anthropic is rate-limiting or temporarily overloaded. Please wait a moment and try again.";
  }

  return raw;
}

/** Pull all text out of a Claude message response. */
function textFromMessage(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

/**
 * Extract a JSON object from a model response that *should* be pure JSON but may
 * occasionally be wrapped in prose or code fences.
 */
function extractJson(raw: string): unknown {
  const trimmed = raw.trim();

  // Strip ```json ... ``` fences if present.
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    // Fall back to the substring between the first { and the last }.
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      return JSON.parse(candidate.slice(first, last + 1));
    }
    throw new Error("The AI response was not valid JSON.");
  }
}

/**
 * Call Claude with a system prompt and a user message, expecting a JSON object.
 */
export async function callJson<T = unknown>(params: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<T> {
  const client = getClient();
  const message = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: params.maxTokens ?? 4096,
    temperature: params.temperature ?? 0.4,
    system: params.system,
    messages: [{ role: "user", content: params.user }],
  });

  // A truncated response (hit max_tokens) yields incomplete JSON. Detect it
  // explicitly so the user gets an actionable message instead of a generic
  // parse failure.
  if (message.stop_reason === "max_tokens") {
    throw new Error(
      "The AI response was cut off (max_tokens reached) before valid JSON could be produced."
    );
  }

  const text = textFromMessage(message);
  return extractJson(text) as T;
}
