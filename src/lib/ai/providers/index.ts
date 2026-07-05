import { openAiCompatConfig, type ProviderId } from "../models";
import { AnthropicProvider } from "./anthropic";
import { OpenAICompatibleProvider } from "./openai-compatible";
import type { AiProvider } from "./types";

export type { AiProvider, GenerateRequest, GenerateResult } from "./types";
export { LocalProviderUnavailableError } from "./types";

/** Build a concrete provider for a given provider id + model. */
export function makeProvider(
  provider: ProviderId,
  model: string,
  isLocal: boolean
): AiProvider {
  if (provider === "anthropic") return new AnthropicProvider(model);
  const { baseUrl, apiKey } = openAiCompatConfig(provider);
  return new OpenAICompatibleProvider(provider, baseUrl, apiKey, model, isLocal);
}
