/**
 * @fileoverview Core API client for Requesty CLI
 * @author Requesty CLI Team
 * @license MIT
 * @copyright 2024 Requesty CLI Contributors
 */

import * as fs from 'fs';
import OpenAI from 'openai';
import * as path from 'path';
import { ErrorHandler } from '../utils/error-handler';
import { InputValidator } from '../utils/input-validator';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { OpenAIClientFactory } from './openai-client-factory';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  CLIConfig,
  ModelInfo,
} from './types';

/**
 * Main API client for handling OpenAI API interactions
 * Provides optimized, cached, and monitored API calls
 */
export class RequestyAPI {
  private config: CLIConfig;
  private openai: OpenAI;
  private static cachedModels: ModelInfo[] | null = null;
  private fetchedModels: ModelInfo[] = [];

  /**
   * Creates a new RequestyAPI instance
   * @param config - CLI configuration containing API settings
   */
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

  /**
   * Retrieves available models from the API
   * @returns Promise resolving to array of available models
   * @throws {Error} If API call fails and no fallback models available
   */
  async getModels(): Promise<ModelInfo[]> {
    try {
      const { result } = await PerformanceMonitor.measureAsync(async () => {
        try {
          const response = await this.openai.models.list();

          // Transform Requesty API models to our ModelInfo format
          const models = response.data.map((model: any) => ({
            id: model.id,
            name: model.id,
            provider: this.extractProvider(model.id),
            object: model.object,
            created: model.created,
            owned_by: model.owned_by,
            input_price: model.input_price,
            output_price: model.output_price,
            contextWindow: model.context_window,
            maxOutputTokens: model.max_output_tokens,
            supportsCaching: model.supports_caching,
            supportsVision: model.supports_vision,
            supportsComputerUse: model.supports_computer_use,
            supportsReasoning: model.supports_reasoning,
            description: model.description,
          }));

          if (models.length > 0) {
            this.fetchedModels = models;
            return models;
          } else {
            return this.getAvailableModels();
          }
        } catch (error) {
          // Silently fall back to defaults
          return this.getAvailableModels();
        }
      }, 'getModels');

      return result;
    } catch (error) {
      return this.getAvailableModels();
    }
  }

  /**
   * Extract provider name from model ID
   * @param modelId - Model ID like "openai/gpt-4" or "anthropic/claude-3"
   * @returns Provider name
   */
  private extractProvider(modelId: string): string {
    const parts = modelId.split('/');
    if (parts.length > 1) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return 'Unknown';
  }

  /**
   * Sends a chat completion request to the API
   * @param request - Chat completion request object
   * @returns Promise resolving to chat completion response
   * @throws {Error} If request validation fails or API call fails
   */
  async sendChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    // Validate request
    const validatedModel = InputValidator.validateModelName(request.model);
    const validatedMessages = request.messages.map((msg) => ({
      ...msg,
      content:
        typeof msg.content === 'string'
          ? InputValidator.validatePrompt(msg.content)
          : msg.content,
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

        const response =
          await this.openai.chat.completions.create(requestParams);
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

  /**
   * Map a simple model name to an available model on the server
   * @param modelName - Simple model name (e.g., 'gpt-4o-mini')
   * @returns The actual model ID available on the server
   */
  private mapModelNameSync(modelName: string): string {
    // Don't fetch models during testing - just return the name as-is
    // The server will handle the mapping
    return modelName;
  }

  /**
   * Tests a specific model with a prompt
   * @param model - Model information or model name string
   * @param prompt - Text prompt to test with
   * @param streaming - Whether to use streaming response
   * @param metadata - Optional metadata for the request
   * @returns Promise resolving to test result with performance metrics
   */
  async testModel(
    model: ModelInfo | string,
    prompt: string,
    streaming = false,
    metadata?: any
  ): Promise<{
    success: boolean;
    response?: ChatCompletionResponse;
    rawResponse?: any;
    error?: string;
    duration: number;
    usage?: any;
    cost?: number;
    blendedCost?: number;
  }> {
    // Handle both string and ModelInfo inputs
    let modelInfo: any;
    const modelName = typeof model === 'string' ? model : model.name;

    if (typeof model === 'string') {
      // Try to find the model info from fetched models first (has real pricing)
      const fetchedModel = this.fetchedModels.find(
        (m) => m.id === model || m.name === model
      );
      const fallbackModel = this.getModelByName(model);
      modelInfo = fetchedModel ||
        fallbackModel || { name: model, provider: 'Unknown' };
    } else {
      modelInfo = model;
    }

    // Map the model name to an available model
    const mappedModelName = this.mapModelNameSync(modelName);

    // Validate inputs
    const validatedModel = InputValidator.validateModelName(mappedModelName);
    const validatedPrompt = InputValidator.validatePrompt(prompt);

    const { result, duration } = await PerformanceMonitor.measureAsync(
      async () => {
        try {
          const request: ChatCompletionRequest = {
            model: validatedModel,
            messages: [{ role: 'user', content: validatedPrompt }],
            temperature: this.config.temperature,
            stream: streaming,
            requesty: metadata,
          };

          const response = await this.sendChatCompletion(request);

          // Calculate cost if pricing available
          let cost = 0;
          let blendedCost = 0;

          if (response.usage) {
            // Use pricing from fetched models (real API pricing)
            let inputPrice = 0;
            let outputPrice = 0;

            if (modelInfo.input_price && modelInfo.output_price) {
              inputPrice = modelInfo.input_price;
              outputPrice = modelInfo.output_price;
            } else if (modelInfo.pricing) {
              inputPrice = modelInfo.pricing.input;
              outputPrice = modelInfo.pricing.output;
            }

            if (inputPrice > 0 || outputPrice > 0) {
              // Calculate actual costs
              const inputCost = response.usage.prompt_tokens * inputPrice;
              const outputCost = response.usage.completion_tokens * outputPrice;
              cost = inputCost + outputCost;

              // Calculate blended cost per million tokens
              const totalTokens = response.usage.total_tokens;
              if (totalTokens > 0) {
                blendedCost = (cost / totalTokens) * 1000000;
              }
            }
          }

          return {
            success: true,
            response,
            rawResponse: response,
            usage: response.usage,
            cost,
            blendedCost,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
      `testModel-${validatedModel}`
    );

    return {
      ...result,
      duration,
    };
  }

  /**
   * Get model by name from available models
   * @param modelName - Name of the model to find
   * @returns Model info or null if not found
   */
  getModelByName(modelName: string): ModelInfo | null {
    const models = this.getAvailableModels();
    return models.find((model) => model.name === modelName) || null;
  }

  /**
   * Get all available models (loaded from configuration)
   * @returns Array of available models
   */
  getAvailableModels(): ModelInfo[] {
    // Use cached models if available
    if (RequestyAPI.cachedModels) {
      return RequestyAPI.cachedModels!;
    }

    try {
      // Load models from configuration file
      const configPath = path.join(__dirname, '..', 'config', 'models.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);

      // Validate and cache the models
      RequestyAPI.cachedModels = config.models.map((model: any) => ({
        name: model.name,
        provider: model.provider,
        contextWindow: model.contextWindow,
        pricing: model.pricing,
        supportsStreaming: model.supportsStreaming,
        supportsTools: model.supportsTools,
        supportsVision: model.supportsVision,
        supportsJson: model.supportsJson,
      }));

      return RequestyAPI.cachedModels!;
    } catch (error) {
      // Use the user's specified default models
      const fallbackModels = [
        {
          name: 'openai/gpt-4.1',
          provider: 'OpenAI',
          contextWindow: 128000,
          input_price: 0.0000025,
          output_price: 0.00001,
          supportsStreaming: true,
          supportsTools: true,
          supportsVision: true,
          supportsJson: true,
        },
        {
          name: 'anthropic/claude-sonnet-4-20250514',
          provider: 'Anthropic',
          contextWindow: 200000,
          input_price: 0.000003,
          output_price: 0.000015,
          supportsStreaming: true,
          supportsTools: true,
          supportsVision: true,
          supportsJson: true,
        },
        {
          name: 'google/gemini-2.5-flash',
          provider: 'Google',
          contextWindow: 1000000,
          input_price: 0.0000003,
          output_price: 0.0000012,
          supportsStreaming: true,
          supportsTools: true,
          supportsVision: true,
          supportsJson: true,
        },
        {
          name: 'mistral/mistral-large-latest',
          provider: 'Mistral',
          contextWindow: 128000,
          input_price: 0.000002,
          output_price: 0.000006,
          supportsStreaming: true,
          supportsTools: true,
          supportsVision: false,
          supportsJson: true,
        },
      ];

      RequestyAPI.cachedModels = fallbackModels;
      return fallbackModels;
    }
  }

  /**
   * Reload models from configuration file
   * @returns Array of reloaded models
   */
  reloadModels(): ModelInfo[] {
    RequestyAPI.cachedModels = null;
    return this.getAvailableModels();
  }
}
