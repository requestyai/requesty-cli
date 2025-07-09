import OpenAI from 'openai';
import { ModelInfo, ChatCompletionRequest, ChatCompletionResponse, CLIConfig } from './types';

export class RequestyAPI {
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

  async getModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.openai.models.list();
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const requestParams: any = {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        stream: request.stream || false,
      };

      // Add Requesty metadata directly to request body (Test 5 approach that works!)
      if (request.requesty) {
        requestParams.requesty = request.requesty;
      }

      const response = await this.openai.chat.completions.create(requestParams);
      return response as ChatCompletionResponse;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`API Error: ${error.message}`);
      }
      throw new Error(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testModel(model: string, prompt: string, metadata?: any): Promise<{ success: boolean; response?: ChatCompletionResponse; rawResponse?: any; error?: string; duration: number }> {
    const startTime = Date.now();
    
    try {
      const request: ChatCompletionRequest = {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.temperature,
        stream: false,
        requesty: metadata
      };

      const response = await this.sendChatCompletion(request);
      const duration = Date.now() - startTime;

      return {
        success: true,
        response,
        rawResponse: response, // Store the raw response for debugging
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }
}