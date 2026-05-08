import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import type {
  AiProvider,
  AiResponse,
  GenerateOptions,
} from './ai-provider.interface';

@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAiProvider.name);
  private model: ChatOpenAI | null = null;
  private modelName: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    this.modelName = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';

    if (apiKey) {
      this.model = new ChatOpenAI({
        openAIApiKey: apiKey,
        model: this.modelName,
        temperature: 0.7,
        streaming: false,
        maxRetries: 1,
      });
      this.logger.log(`OpenAI initialized (model: ${this.modelName})`);
    } else {
      this.logger.warn('OpenAI not configured — OPENAI_API_KEY missing');
    }
  }

  isAvailable(): boolean {
    return this.model !== null;
  }

  async generate(
    prompt: string,
    options?: GenerateOptions,
  ): Promise<AiResponse> {
    if (!this.model) throw new Error('OpenAI not available');

    const messages: BaseMessage[] = [];
    if (options?.systemPrompt)
      messages.push(new SystemMessage(options.systemPrompt));
    messages.push(new HumanMessage(prompt));

    const response = await this.model.invoke(messages);

    return {
      text: response.content as string,
      tokensUsed: response.usage_metadata?.total_tokens ?? 0,
      model: this.modelName,
      provider: this.name,
    };
  }

  async *stream(
    prompt: string,
    options?: GenerateOptions,
  ): AsyncGenerator<string> {
    if (!this.model) throw new Error('OpenAI not available');

    const streamingModel = new ChatOpenAI({
      openAIApiKey: this.config.get<string>('OPENAI_API_KEY'),
      model: this.modelName,
      streaming: true,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens,
    });

    const messages: BaseMessage[] = [];
    if (options?.systemPrompt)
      messages.push(new SystemMessage(options.systemPrompt));
    messages.push(new HumanMessage(prompt));

    const stream = await streamingModel.stream(messages);
    for await (const chunk of stream) {
      const content = chunk.content;
      if (typeof content === 'string' && content) {
        yield content;
      }
    }
  }
}
