import OpenAI from 'openai';
import { ModelInfo, ChatCompletionRequest, ChatCompletionResponse, CLIConfig } from './types';
import { OpenAIClientFactory } from './openai-client-factory';
import { connectionPool } from './connection-pool';
import { cacheManager } from './cache-manager';
import { ErrorHandler } from '../utils/error-handler';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { InputValidator } from '../utils/input-validator';

export class RequestyAPI {
  private config: CLIConfig;
  private openai: OpenAI;

  constructor(config: CLIConfig) {
    this.config = config;
    this.openai = connectionPool.getClient(config);
  }

  async getModels(): Promise<ModelInfo[]> {
    try {
      const { result } = await PerformanceMonitor.measureAsync(async () => {
        try {
          const response = await this.openai.models.list();
          // Transform OpenAI models to our ModelInfo format
          return response.data.map(model => ({
            id: model.id,
            name: model.id,
            provider: model.owned_by || 'Unknown',
            object: model.object,
            created: model.created,
            owned_by: model.owned_by
          }));
        } catch (error) {
          console.warn('Failed to fetch models from API, using defaults');
          // Return default models if API fails
          return this.getAvailableModels();
        }
      }, 'getModels');
      
      return result;
    } catch (error) {
      console.warn('Error in getModels, using defaults');
      return this.getAvailableModels();
    }
  }

  async sendChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Validate request
    const validatedModel = InputValidator.validateModelName(request.model);
    const validatedMessages = request.messages.map(msg => ({
      ...msg,
      content: typeof msg.content === 'string' ? InputValidator.validatePrompt(msg.content) : msg.content
    }));

    const { result } = await PerformanceMonitor.measureAsync(async () => {
      try {
        const requestParams: any = {
          model: validatedModel,
          messages: validatedMessages,
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
          ErrorHandler.handleApiError(error, `API Error: ${error.message}`);
        }
        ErrorHandler.handleApiError(error, 'Network Error');
      }
    }, `sendChatCompletion-${validatedModel}`);

    return result;
  }

  async testModel(model: ModelInfo | string, prompt: string, streaming = false, metadata?: any): Promise<{ success: boolean; response?: ChatCompletionResponse; rawResponse?: any; error?: string; duration: number; usage?: any; cost?: number }> {
    // Handle both string and ModelInfo inputs
    const modelInfo = typeof model === 'string' ? { name: model, provider: 'Unknown' } : model;
    const modelName = typeof model === 'string' ? model : model.name;
    
    // Validate inputs
    const validatedModel = InputValidator.validateModelName(modelName);
    const validatedPrompt = InputValidator.validatePrompt(prompt);
    
    const { result, duration } = await PerformanceMonitor.measureAsync(async () => {
      try {
        const request: ChatCompletionRequest = {
          model: validatedModel,
          messages: [{ role: 'user', content: validatedPrompt }],
          temperature: this.config.temperature,
          stream: streaming,
          requesty: metadata
        };

        const response = await this.sendChatCompletion(request);
        
        // Calculate cost if pricing available
        let cost = 0;
        if (modelInfo.pricing && response.usage) {
          const inputCost = (response.usage.prompt_tokens / 1000000) * modelInfo.pricing.input;
          const outputCost = (response.usage.completion_tokens / 1000000) * modelInfo.pricing.output;
          cost = inputCost + outputCost;
        } else if (modelInfo.input_price && modelInfo.output_price && response.usage) {
          const inputCost = (response.usage.prompt_tokens / 1000000) * modelInfo.input_price;
          const outputCost = (response.usage.completion_tokens / 1000000) * modelInfo.output_price;
          cost = inputCost + outputCost;
        }

        return {
          success: true,
          response,
          rawResponse: response,
          usage: response.usage,
          cost
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }, `testModel-${validatedModel}`);

    return {
      ...result,
      duration
    };
  }

  /**
   * Get model by name from available models
   * @param modelName - Name of the model to find
   * @returns Model info or null if not found
   */
  getModelByName(modelName: string): ModelInfo | null {
    const models = this.getAvailableModels();
    return models.find(model => model.name === modelName) || null;
  }

  /**
   * Get all available models (cached)
   * @returns Array of available models
   */
  getAvailableModels(): ModelInfo[] {
    // This would typically come from a config file or API
    // For now, return a default set of models
    return [
      {
        name: 'gpt-4o-mini',
        provider: 'OpenAI',
        contextWindow: 128000,
        pricing: { input: 0.15, output: 0.6 },
        supportsStreaming: true,
        supportsTools: true,
        supportsVision: true,
        supportsJson: true
      },
      {
        name: 'gpt-4o',
        provider: 'OpenAI',
        contextWindow: 128000,
        pricing: { input: 2.5, output: 10 },
        supportsStreaming: true,
        supportsTools: true,
        supportsVision: true,
        supportsJson: true
      },
      {
        name: 'claude-3-5-sonnet-20241022',
        provider: 'Anthropic',
        contextWindow: 200000,
        pricing: { input: 3, output: 15 },
        supportsStreaming: true,
        supportsTools: true,
        supportsVision: true,
        supportsJson: true
      },
      {
        name: 'claude-3-5-haiku-20241022',
        provider: 'Anthropic',
        contextWindow: 200000,
        pricing: { input: 1, output: 5 },
        supportsStreaming: true,
        supportsTools: true,
        supportsVision: true,
        supportsJson: true
      },
      {
        name: 'gemini-1.5-flash',
        provider: 'Google',
        contextWindow: 1000000,
        pricing: { input: 0.15, output: 0.6 },
        supportsStreaming: true,
        supportsTools: true,
        supportsVision: true,
        supportsJson: true
      }
    ];
  }
}