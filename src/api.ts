import axios, { AxiosResponse } from 'axios';
import { ModelInfo, ChatCompletionRequest, ChatCompletionResponse, CLIConfig } from './types';

export class RequestyAPI {
  private config: CLIConfig;
  private axiosInstance;

  constructor(config: CLIConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });
  }

  async getModels(): Promise<ModelInfo[]> {
    try {
      const response: AxiosResponse<{ data: ModelInfo[] }> = await this.axiosInstance.get('/models');
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response: AxiosResponse<ChatCompletionResponse> = await this.axiosInstance.post('/chat/completions', request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        throw new Error(`API Error: ${errorMessage}`);
      }
      throw new Error(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testModel(model: string, prompt: string): Promise<{ success: boolean; response?: ChatCompletionResponse; error?: string; duration: number }> {
    const startTime = Date.now();
    
    try {
      const request: ChatCompletionRequest = {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: false
      };

      const response = await this.sendChatCompletion(request);
      const duration = Date.now() - startTime;

      return {
        success: true,
        response,
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