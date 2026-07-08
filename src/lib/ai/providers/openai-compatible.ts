import { extractJson } from "../client";
import { estimateTokens, priceFor } from "../cost";
import type { ProviderId } from "../models";
import {
  AiProvider,
  GenerateRequest,
  GenerateResult,
  LocalProviderUnavailableError,
} from "./types";

// ---------------------------------------------------------------------------
// One adapter for every OpenAI Chat Completions-compatible endpoint: OpenAI,
// Google Gemini (compat endpoint), Groq, Ollama, and vLLM. They differ only in
// base URL and API key, so a single fetch-based client covers all of them —
// no extra SDK dependencies.
// ---------------------------------------------------------------------------

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string } | string;
}

export class OpenAICompatibleProvider implements AiProvider {
  constructor(
    private readonly provider: ProviderId,
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string,
    private readonly isLocal: boolean
  ) {}

  getProviderName(): string {
    return this.provider;
  }
  getModelName(): string {
    return this.model;
  }
  estimateCost(inputTokens: number, outputTokens: number): number {
    return priceFor(this.model, { inputTokens, outputTokens });
  }

  async generateText(req: GenerateRequest): Promise<GenerateResult> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const body = {
      model: this.model,
      max_tokens: req.maxTokens ?? 8192,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.user },
      ],
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      // Connection refused / DNS / timeout — most likely the local server is down.
      if (this.isLocal) {
        throw new LocalProviderUnavailableError(this.provider, this.baseUrl);
      }
      throw new Error(
        `Could not reach the ${this.provider} API: ${
          err instanceof Error ? err.message : "network error"
        }`
      );
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `${this.provider} API error (${res.status}): ${detail.slice(0, 300)}`
      );
    }

    const data = (await res.json()) as ChatCompletionResponse;
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) {
      const msg =
        typeof data.error === "string" ? data.error : data.error?.message;
      throw new Error(
        `${this.provider} returned an empty response${msg ? `: ${msg}` : "."}`
      );
    }

    const inputTokens = data.usage?.prompt_tokens ?? estimateTokens(req.system + req.user);
    const outputTokens = data.usage?.completion_tokens ?? estimateTokens(text);
    return {
      text,
      usage: { inputTokens, outputTokens },
      provider: this.getProviderName(),
      model: this.model,
      costUsd: this.estimateCost(inputTokens, outputTokens),
    };
  }

  async generateJson<T = unknown>(
    req: GenerateRequest
  ): Promise<GenerateResult & { value: T }> {
    const result = await this.generateText(req);
    return { ...result, value: extractJson(result.text) as T };
  }
}
