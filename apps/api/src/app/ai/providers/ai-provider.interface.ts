/**
 * AI Provider interface — implement this to add a new LLM provider.
 * The AiService picks the first available provider at runtime.
 */
export interface AiProvider {
  readonly name: string;
  isAvailable(): boolean;
  generate(prompt: string, options?: GenerateOptions): Promise<AiResponse>;
  stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AiResponse {
  text: string;
  tokensUsed: number;
  model: string;
  provider: string;
}
