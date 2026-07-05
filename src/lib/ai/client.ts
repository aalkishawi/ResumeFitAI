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
 * Escape raw control characters (newlines, tabs, etc.) that appear *inside*
 * JSON string literals. Models frequently emit multi-line string values — like
 * a tailored resume — with literal newlines, which is invalid JSON and the most
 * common cause of a mid-string parse failure. This walks the text tracking
 * whether we're inside a string and escapes control chars only there, leaving
 * structural whitespace between tokens untouched.
 */
function escapeControlCharsInStrings(json: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString && ch.charCodeAt(0) < 0x20) {
      // Control character inside a string — escape it to valid JSON.
      if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "\\r";
      else if (ch === "\t") out += "\\t";
      else if (ch === "\b") out += "\\b";
      else if (ch === "\f") out += "\\f";
      else out += "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0");
      continue;
    }
    out += ch;
  }
  return out;
}

/** Try to parse, first as-is then after repairing in-string control chars. */
function tryParse(s: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch {
    /* fall through to repair */
  }
  try {
    return { ok: true, value: JSON.parse(escapeControlCharsInStrings(s)) };
  } catch {
    return { ok: false };
  }
}

/**
 * Extract a JSON object from a model response that *should* be pure JSON but may
 * occasionally be wrapped in prose/code fences or contain unescaped control
 * characters inside string values.
 */
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();

  // Strip ```json ... ``` fences if present.
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  const direct = tryParse(candidate);
  if (direct.ok) return direct.value;

  // Fall back to the substring between the first { and the last }.
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const sliced = tryParse(candidate.slice(first, last + 1));
    if (sliced.ok) return sliced.value;
  }

  throw new Error("The AI response was not valid JSON.");
}

export interface CallParams {
  system: string;
  user: string;
  maxTokens?: number;
  /**
   * Deprecated/ignored. Newer models (e.g. claude-sonnet-5) reject the
   * `temperature` parameter, so it is no longer forwarded to the API. Kept in
   * the signature so existing callers don't need to change.
   */
  temperature?: number;
}

/** Call Claude and return the raw text of the response. */
export async function callText(params: CallParams): Promise<string> {
  const client = getClient();
  // Stream the response. Large max_tokens values (needed so a long tailored
  // resume isn't truncated) can exceed the SDK's non-streaming HTTP timeout,
  // so we always stream and collect the final message.
  const stream = client.messages.stream({
    model: DEFAULT_MODEL,
    max_tokens: params.maxTokens ?? 8192,
    // Disable extended thinking. On claude-sonnet-5 adaptive thinking is ON by
    // default (when `thinking` is omitted), and thinking tokens count against
    // max_tokens — they were eating the budget and truncating the output. This
    // is structured extraction, so we don't need thinking; give the whole
    // budget to the response.
    thinking: { type: "disabled" },
    system: params.system,
    messages: [{ role: "user", content: params.user }],
  });
  const message = await stream.finalMessage();

  // A truncated response (hit max_tokens) yields incomplete output. Detect it
  // explicitly so the user gets an actionable message instead of a generic
  // parse failure.
  if (message.stop_reason === "max_tokens") {
    throw new Error(
      "The AI response was cut off (max_tokens reached) before it finished."
    );
  }

  return textFromMessage(message);
}

/**
 * Call Claude with a system prompt and a user message, expecting a JSON object.
 */
export async function callJson<T = unknown>(params: CallParams): Promise<T> {
  const text = await callText(params);
  return extractJson(text) as T;
}
