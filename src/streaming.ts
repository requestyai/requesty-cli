import axios, { AxiosResponse } from 'axios';
import { CLIConfig, ChatCompletionRequest } from './types';

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string;
  }[];
}

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

  constructor(config: CLIConfig) {
    this.config = config;
  }

  async streamCompletion(
    request: ChatCompletionRequest,
    onChunk: (chunk: string, stats: { tokensPerSecond: number; totalTokens: number }) => void
  ): Promise<StreamingResult> {
    const startTime = Date.now();
    let fullResponse = '';
    let totalTokens = 0;

    try {
      const response = await axios.post(
        `${this.config.baseURL}/chat/completions`,
        { ...request, stream: true },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
            'Accept': 'text/event-stream'
          },
          responseType: 'stream',
          timeout: this.config.timeout
        }
      );

      return new Promise((resolve, reject) => {
        let buffer = '';
        
        response.data.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                const duration = Date.now() - startTime;
                const tokensPerSecond = totalTokens / (duration / 1000);
                
                resolve({
                  success: true,
                  fullResponse,
                  duration,
                  tokensPerSecond,
                  totalTokens
                });
                return;
              }

              try {
                const parsed: StreamChunk = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;
                
                if (content) {
                  fullResponse += content;
                  totalTokens += this.estimateTokens(content);
                  
                  const currentDuration = Date.now() - startTime;
                  const tokensPerSecond = totalTokens / (currentDuration / 1000);
                  
                  onChunk(content, { tokensPerSecond, totalTokens });
                }
              } catch (e) {
                // Skip invalid JSON chunks
              }
            }
          }
        });

        response.data.on('end', () => {
          const duration = Date.now() - startTime;
          const tokensPerSecond = totalTokens / (duration / 1000);
          
          resolve({
            success: true,
            fullResponse,
            duration,
            tokensPerSecond,
            totalTokens
          });
        });

        response.data.on('error', (error: Error) => {
          reject(error);
        });
      });

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