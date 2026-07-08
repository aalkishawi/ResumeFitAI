// ---------------------------------------------------------------------------
// Provider abstraction. Business logic (the pipeline) depends only on this
// interface, never on a concrete SDK. Adding a provider = implementing this.
// ---------------------------------------------------------------------------

export interface GenerateRequest {
  system: string;
  user: string;
  maxTokens?: number;
  /** Optional label for cost logging (e.g. "analysis", "tailoring"). */
  task?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface GenerateResult {
  text: string;
  usage: TokenUsage;
  provider: string;
  model: string;
  costUsd: number;
}

export interface AiProvider {
  getProviderName(): string;
  getModelName(): string;
  /** Estimated USD cost for a given token count on this provider/model. */
  estimateCost(inputTokens: number, outputTokens: number): number;
  /** Generate raw text. */
  generateText(req: GenerateRequest): Promise<GenerateResult>;
  /** Generate and parse a JSON object from the response. */
  generateJson<T = unknown>(
    req: GenerateRequest
  ): Promise<GenerateResult & { value: T }>;
}

/** Thrown when a local inference server (Ollama/vLLM) can't be reached. */
export class LocalProviderUnavailableError extends Error {
  constructor(providerName: string, baseUrl: string) {
    super(
      `Local model server "${providerName}" is not reachable at ${baseUrl}. ` +
        `Make sure it is running (e.g. \`ollama serve\`) or switch off Local Mode.`
    );
    this.name = "LocalProviderUnavailableError";
  }
}
