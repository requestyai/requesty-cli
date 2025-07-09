import OpenAI from 'openai';
import { CLIConfig, ChatCompletionRequest } from './types';


export interface StreamingResult {
  success: boolean;
  fullResponse: string;
  error?: string;
  duration: number;
  tokensPerSecond: number;
  totalTokens: number;
}

export class StreamingClient {
  private config: CLIConfig;
  private openai: OpenAI;

  constructor(config: CLIConfig) {
    this.config = config;
    this.openai = new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey || '<REQUESTY_API_KEY>',
      timeout: config.timeout,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/requestyai/requesty-cli',
        'X-Title': 'requesty-cli',
      },
    });
  }

  async streamCompletion(
    request: ChatCompletionRequest,
    onChunk: (chunk: string, stats: { tokensPerSecond: number; totalTokens: number }) => void
  ): Promise<StreamingResult> {
    const startTime = Date.now();
    let fullResponse = '';
    let totalTokens = 0;

    try {
      const stream = await this.openai.chat.completions.create({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        stream: true,
      });

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

      const duration = Date.now() - startTime;
      const tokensPerSecond = totalTokens / (duration / 1000);
      
      return {
        success: true,
        fullResponse,
        duration,
        tokensPerSecond,
        totalTokens
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        fullResponse: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        tokensPerSecond: 0,
        totalTokens: 0
      };
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}