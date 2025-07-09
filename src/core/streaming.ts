import OpenAI from 'openai';
import { InputValidator } from '../utils/input-validator';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { OpenAIClientFactory } from './openai-client-factory';
import { CLIConfig, ChatCompletionRequest } from './types';

export interface StreamingResult {
  success: boolean;
  fullResponse: string;
  error?: string;
  duration: number;
  tokensPerSecond: number;
  totalTokens: number;
  usage?: any;
  cost?: number;
}

export class StreamingClient {
  private config: CLIConfig;
  private openai: OpenAI;

  constructor(config: CLIConfig) {
    this.config = config;
    this.openai = OpenAIClientFactory.create(config);
  }

  /**
   * Update the configuration and refresh the OpenAI client
   * @param config - New CLI configuration
   */
  updateConfig(config: CLIConfig): void {
    this.config = config;
    this.openai = OpenAIClientFactory.create(config);
  }

  async streamCompletion(
    request: ChatCompletionRequest,
    onChunk: (
      chunk: string,
      stats: { tokensPerSecond: number; totalTokens: number }
    ) => void,
    model?: { pricing?: { input: number; output: number } }
  ): Promise<StreamingResult> {
    // Validate request
    const validatedModel = InputValidator.validateModelName(request.model);
    const validatedMessages = request.messages.map((msg) => ({
      ...msg,
      content:
        typeof msg.content === 'string'
          ? InputValidator.validatePrompt(msg.content)
          : msg.content,
    }));

    const { result, duration } = await PerformanceMonitor.measureAsync(
      async () => {
        const startTime = Date.now();
        let fullResponse = '';
        let totalTokens = 0;

        try {
          const requestParams: any = {
            model: validatedModel,
            messages: validatedMessages,
            temperature: request.temperature,
            stream: true,
          };

          // Add Requesty metadata directly to request body (Test 5 approach that works!)
          if (request.requesty) {
            requestParams.requesty = request.requesty;
          }

          const stream = (await this.openai.chat.completions.create(
            requestParams
          )) as any;

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;

            if (content) {
              fullResponse += content;
              totalTokens += this.estimateTokens(content);

              const currentDuration = Date.now() - startTime;
              const tokensPerSecond = totalTokens / (currentDuration / 1000);

              onChunk(content, { tokensPerSecond, totalTokens });
            }
          }

          const streamDuration = Date.now() - startTime;
          const tokensPerSecond = totalTokens / (streamDuration / 1000);

          // Calculate cost if pricing available
          let cost = 0;
          if (model?.pricing) {
            // Estimate input tokens (rough calculation)
            const inputTokens = validatedMessages.reduce(
              (sum, msg) =>
                sum +
                this.estimateTokens(
                  typeof msg.content === 'string' ? msg.content : ''
                ),
              0
            );
            const outputTokens = totalTokens;

            const inputCost = (inputTokens / 1000000) * model.pricing.input;
            const outputCost = (outputTokens / 1000000) * model.pricing.output;
            cost = inputCost + outputCost;
          }

          return {
            success: true,
            fullResponse,
            duration: streamDuration,
            tokensPerSecond,
            totalTokens,
            cost,
          };
        } catch (error) {
          const streamDuration = Date.now() - startTime;

          return {
            success: false,
            fullResponse: '',
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: streamDuration,
            tokensPerSecond: 0,
            totalTokens: 0,
          };
        }
      },
      `streamCompletion-${validatedModel}`
    );

    return {
      ...result,
      duration,
    };
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
