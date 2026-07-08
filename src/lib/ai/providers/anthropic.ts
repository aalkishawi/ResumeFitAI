import { getClient, textFromMessage, extractJson } from "../client";
import { priceFor } from "../cost";
import { MODEL_PRICING } from "../models";
import type { AiProvider, GenerateRequest, GenerateResult } from "./types";

// ---------------------------------------------------------------------------
// Anthropic provider. Streams the response (large max_tokens can exceed the
// SDK's non-streaming HTTP timeout) and reports the real token usage the API
// returns, so cost logging is exact for Claude models.
// ---------------------------------------------------------------------------

export class AnthropicProvider implements AiProvider {
  constructor(private readonly model: string) {}

  getProviderName(): string {
    return "anthropic";
  }
  getModelName(): string {
    return this.model;
  }
  estimateCost(inputTokens: number, outputTokens: number): number {
    return priceFor(this.model, { inputTokens, outputTokens });
  }

  async generateText(req: GenerateRequest): Promise<GenerateResult> {
    const client = getClient();
    const stream = client.messages.stream({
      model: this.model,
      max_tokens: req.maxTokens ?? 8192,
      // Structured extraction — no extended thinking; give the whole budget to
      // the response and keep output cost predictable.
      thinking: { type: "disabled" },
      system: req.system,
      messages: [{ role: "user", content: req.user }],
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "max_tokens") {
      throw new Error(
        "The AI response was cut off (max_tokens reached) before it finished."
      );
    }

    const inputTokens = message.usage?.input_tokens ?? 0;
    const outputTokens = message.usage?.output_tokens ?? 0;
    return {
      text: textFromMessage(message),
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

/** Whether a model id is a known Anthropic model (for pricing sanity checks). */
export function isKnownAnthropicModel(model: string): boolean {
  return model.startsWith("claude-") && model in MODEL_PRICING;
}
