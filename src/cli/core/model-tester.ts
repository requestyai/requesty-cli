/**
 * @fileoverview Model testing logic for CLI operations
 * @author Requesty CLI Team
 * @license MIT
 * @copyright 2024 Requesty CLI Contributors
 */

import { RequestyAPI } from '../../core/api';
import { StreamingClient } from '../../core/streaming';
import { ModelInfo } from '../../core/types';
import { DEFAULT_MODELS } from '../../models/models';
import { DynamicResultsTable } from '../../ui/dynamic-table';
import { InteractiveUI } from '../../ui/interactive-ui';
import { SessionManager } from '../../utils/session-manager';

/**
 * Result from testing a model
 */
export interface ModelTestResult {
  model: string;
  success: boolean;
  response?: any;
  error?: string;
  duration: number;
  cost?: number;
  blendedCost?: number;
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
}

/**
 * Handles all model testing operations
 * Extracted from the monolithic CLI class for better separation of concerns
 */
export class ModelTester {
  private api: RequestyAPI;
  private streaming: StreamingClient;
  private ui: InteractiveUI;
  private sessionManager: SessionManager;

  /**
   * Creates a new model tester
   * @param api - API client instance
   * @param streaming - Streaming client instance
   * @param ui - Interactive UI instance
   */
  constructor(api: RequestyAPI, streaming: StreamingClient, ui: InteractiveUI) {
    this.api = api;
    this.streaming = streaming;
    this.ui = ui;
    this.sessionManager = SessionManager.getInstance();
  }

  /**
   * Run quick start testing with default models
   * @param availableModels - Array of available models (ignored - we use defaults)
   */
  async runQuickStart(availableModels: ModelInfo[]): Promise<void> {
    try {
      console.log('\n🚀 Quick Start - Testing 5 Default Models');
      console.log(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      );

      // Start session for tracking
      this.sessionManager.startSession('model_comparison');

      // Get prompt from user
      const prompt = await this.ui.getPrompt();

      // Always use DEFAULT_MODELS for quick start - don't rely on API
      const modelsToTest = DEFAULT_MODELS;

      console.log(`📋 Using default models: ${modelsToTest.join(', ')}`);

      if (modelsToTest.length === 0) {
        console.log('❌ No default models available for testing');
        return;
      }

      // Test models (no streaming for quick start - keep it simple and fast)
      const results = await this.testModels(modelsToTest, prompt, false);

      // Display results
      await this.displayResults(results, 'Quick Start Results');
    } catch (error) {
      console.error(
        '❌ Quick Start Error:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      // Always end session
      this.sessionManager.endSession();
    }
  }

  /**
   * Run custom model selection testing
   * @param availableModels - Array of available models
   */
  async runCustomSelection(availableModels: ModelInfo[]): Promise<void> {
    try {
      console.log('\n🎯 Custom Model Selection');
      console.log(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      );

      // Start session for tracking
      this.sessionManager.startSession('model_comparison');

      // Show available models
      await this.displayAvailableModels(availableModels);

      // Get user selection
      const selectedModels = await this.ui.selectModels();

      if (selectedModels.length === 0) {
        console.log('❌ No models selected');
        return;
      }

      // Get prompt from user
      const prompt = await this.ui.getPrompt();

      // Get streaming preference
      const streaming = await this.ui.getStreamingChoice();

      // Test selected models
      const modelNames = selectedModels.map((m: any) =>
        typeof m === 'string' ? m : m.name
      );
      const results = await this.testModels(modelNames, prompt, streaming);

      // Display results
      await this.displayResults(results, 'Custom Selection Results');
    } catch (error) {
      console.error(
        '❌ Custom Selection Error:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      // Always end session
      this.sessionManager.endSession();
    }
  }

  /**
   * Test multiple models with a prompt
   * @param models - Models to test (can be strings or ModelInfo objects)
   * @param prompt - Prompt to test with
   * @param streaming - Whether to use streaming
   * @returns Array of test results
   * @private
   */
  private async testModels(
    models: (ModelInfo | string)[],
    prompt: string,
    streaming: boolean
  ): Promise<ModelTestResult[]> {
    const results: ModelTestResult[] = [];

    console.log(`\n🔄 Testing ${models.length} models...`);

    // Create live results table
    const modelNames = models.map((model) =>
      typeof model === 'string' ? model : model.name
    );

    console.log('\n📊 Live Results:\n');
    const table = new DynamicResultsTable(modelNames, streaming);

    // Test models concurrently for maximum speed with live updates
    const testPromises = models.map(async (model) => {
      try {
        // Handle both string and ModelInfo inputs
        const modelName = typeof model === 'string' ? model : model.name;
        const metadata = this.sessionManager.getRequestyMetadata({
          model: modelName,
          prompt_length: prompt.length,
          request_type: streaming ? 'streaming' : 'standard',
        });

        // Mark as starting
        table.updateModel(modelName, { status: 'running' });

        const result = await this.api.testModel(
          model,
          prompt,
          streaming,
          metadata
        );

        // Calculate reasoning tokens if we have usage data
        let reasoningTokens = 0;
        if (result.usage) {
          const total = result.usage.total_tokens || 0;
          const input = result.usage.prompt_tokens || 0;
          const output = result.usage.completion_tokens || 0;
          reasoningTokens = total - input - output;
        }

        const testResult = {
          model: modelName,
          success: result.success,
          response: result.response,
          error: result.error,
          duration: result.duration,
          cost: result.cost,
          blendedCost: result.blendedCost,
          tokensUsed: result.usage?.total_tokens,
          inputTokens: result.usage?.prompt_tokens,
          outputTokens: result.usage?.completion_tokens,
          reasoningTokens: reasoningTokens,
        };

        // Update table with result LIVE as this model completes
        table.updateModel(modelName, {
          status: result.success ? 'completed' : 'failed',
          duration: result.duration,
          response: result.response,
          error: result.error,
          actualCost: result.cost,
          blendedCostPerMillion: result.blendedCost,
          totalTokens: result.usage?.total_tokens,
          inputTokens: result.usage?.prompt_tokens,
          outputTokens: result.usage?.completion_tokens,
          reasoningTokens: reasoningTokens,
        });

        return testResult;
      } catch (error) {
        const modelName = typeof model === 'string' ? model : model.name;
        const testResult = {
          model: modelName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: 0,
        };

        // Update table with error LIVE as this model fails
        table.updateModel(modelName, {
          status: 'failed',
          error: testResult.error,
          duration: 0,
        });

        return testResult;
      }
    });

    // Wait for all concurrent requests to complete
    const testResults = await Promise.all(testPromises);
    results.push(...testResults);

    return results;
  }

  /**
   * Display available models
   * @param models - Models to display
   * @private
   */
  private async displayAvailableModels(models: ModelInfo[]): Promise<void> {
    console.log('\n📋 Available Models:');

    models.forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.name} (${model.provider})`);
    });

    console.log();
  }

  /**
   * Display test results summary
   * @param results - Test results to display
   * @param title - Title for the results
   * @private
   */
  private async displayResults(
    results: ModelTestResult[],
    title: string
  ): Promise<void> {
    console.log(`\n📊 ${title}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Show summary (table was already shown live during testing)
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`\n🎯 Final Summary:`);
    console.log(`✅ Successful: ${successful}/${results.length}`);
    console.log(`❌ Failed: ${failed}/${results.length}`);

    if (successful > 0) {
      const durations = results.filter((r) => r.success).map((r) => r.duration);
      const avgDuration = Math.round(
        durations.reduce((a, b) => a + b, 0) / durations.length
      );
      const fastestDuration = Math.min(...durations);
      const slowestDuration = Math.max(...durations);
      const medianDuration = durations.sort((a, b) => a - b)[
        Math.floor(durations.length / 2)
      ];

      const fastest = results
        .filter((r) => r.success)
        .find((r) => r.duration === fastestDuration);
      const slowest = results
        .filter((r) => r.success)
        .find((r) => r.duration === slowestDuration);

      console.log(`\n⏱️  Timing Analysis:`);
      console.log(`   Average: ${avgDuration}ms`);
      console.log(`   Fastest: ${fastestDuration}ms`);
      console.log(`   Slowest: ${slowestDuration}ms`);
      console.log(`   Median: ${medianDuration}ms`);
      console.log(`   🏆 Fastest Model: ${fastest?.model}`);
      console.log(`   🐌 Slowest Model: ${slowest?.model}`);

      const totalTokens = results.reduce(
        (sum, r) => sum + (r.tokensUsed || 0),
        0
      );
      const inputTokens = results.reduce(
        (sum, r) => sum + (r.response?.usage?.prompt_tokens || 0),
        0
      );
      const outputTokens = results.reduce(
        (sum, r) => sum + (r.response?.usage?.completion_tokens || 0),
        0
      );

      console.log(
        `\n📊 Token Usage: ${totalTokens} total (${inputTokens} input + ${outputTokens} output)`
      );
    }
  }
}
