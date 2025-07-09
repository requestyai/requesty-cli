#!/usr/bin/env node

import { Command } from 'commander';
import { RequestyAPI } from './api';
import { InteractiveUI } from './interactive-ui';
import { StreamingClient } from './streaming';
import { DynamicResultsTable } from './dynamic-table';
import { CLIConfig, ChatCompletionRequest } from './types';
import { DEFAULT_MODELS } from './models';

const DEFAULT_CONFIG: CLIConfig = {
  baseURL: 'https://router.requesty.ai/v1',
  timeout: 60000,
  maxTokens: 500,
  temperature: 0.7
};

class RequestyCLI {
  private api: RequestyAPI;
  private streaming: StreamingClient;
  private ui: InteractiveUI;
  private config: CLIConfig;

  constructor(config: CLIConfig) {
    this.config = config;
    this.api = new RequestyAPI(config);
    this.streaming = new StreamingClient(config);
    this.ui = new InteractiveUI();
  }

  async run() {
    try {
      // Load available models
      const models = await this.api.getModels();
      await this.ui.initializeModels(models);

      // Main interaction loop
      let running = true;
      while (running) {
        const action = await this.ui.showMainMenu();

        switch (action) {
          case 'quick':
            await this.runQuickStart();
            break;
          case 'select':
            await this.runCustomSelection();
            break;
          case 'exit':
            running = false;
            break;
        }

        if (running) {
          const continueSession = await this.ui.askContinue();
          if (!continueSession) {
            running = false;
          }
        }
      }

      this.ui.showGoodbye();
    } catch (error) {
      this.ui.showError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  }

  private async runQuickStart() {
    const useStreaming = await this.ui.getStreamingChoice();
    const prompt = await this.ui.getPrompt();
    await this.testModels(DEFAULT_MODELS, prompt, useStreaming);
  }

  private async runCustomSelection() {
    const selectedModels = await this.ui.selectModels();
    const useStreaming = await this.ui.getStreamingChoice();
    const prompt = await this.ui.getPrompt();
    await this.testModels(selectedModels, prompt, useStreaming);
  }

  private async testModels(models: string[], prompt: string, useStreaming: boolean) {
    this.ui.showSelectedModels(models);
    
    const modeText = useStreaming ? 'streaming' : 'standard';
    console.log(`🚀 Testing ${models.length} models concurrently with ${modeText} responses...`);
    console.log();

    // Create dynamic results table
    const resultsTable = new DynamicResultsTable(models, useStreaming);

    if (useStreaming) {
      await this.runStreamingTests(models, prompt, resultsTable);
    } else {
      await this.runStandardTests(models, prompt, resultsTable);
    }

    resultsTable.showCompletedResponses();
    resultsTable.showFinalSummary();
  }

  private async runStreamingTests(models: string[], prompt: string, resultsTable: DynamicResultsTable) {
    const concurrentPromises = models.map(async (model) => {
      resultsTable.updateModel(model, { status: 'running' });

      const request: ChatCompletionRequest = {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: true
      };

      try {
        const result = await this.streaming.streamCompletion(request, (chunk, stats) => {
          resultsTable.updateModel(model, {
            status: 'running',
            tokensPerSecond: stats.tokensPerSecond,
            totalTokens: stats.totalTokens
          });
        });

        if (result.success) {
          resultsTable.updateModel(model, {
            status: 'completed',
            duration: result.duration,
            tokensPerSecond: result.tokensPerSecond,
            totalTokens: result.totalTokens,
            response: result.fullResponse
          });
        } else {
          resultsTable.updateModel(model, {
            status: 'failed',
            duration: result.duration,
            error: result.error
          });
        }
      } catch (error) {
        resultsTable.updateModel(model, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.all(concurrentPromises);
  }

  private async runStandardTests(models: string[], prompt: string, resultsTable: DynamicResultsTable) {
    const concurrentPromises = models.map(async (model) => {
      resultsTable.updateModel(model, { status: 'running' });

      try {
        const result = await this.api.testModel(model, prompt);

        if (result.success && result.response) {
          const usage = result.response.usage;
          resultsTable.updateModel(model, {
            status: 'completed',
            duration: result.duration,
            inputTokens: usage?.prompt_tokens || 0,
            outputTokens: usage?.completion_tokens || 0,
            totalTokens: usage?.total_tokens || 0,
            response: result.response.choices[0]?.message?.content || 'No response'
          });
        } else {
          resultsTable.updateModel(model, {
            status: 'failed',
            duration: result.duration,
            error: result.error
          });
        }
      } catch (error) {
        resultsTable.updateModel(model, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.all(concurrentPromises);
  }
}

async function main() {
  const program = new Command();
  
  program
    .name('requesty')
    .description('Interactive AI Model Testing CLI with Streaming')
    .version('2.0.0');

  program
    .option('-k, --api-key <key>', 'API key for authentication')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '60000')
    .option('-m, --max-tokens <tokens>', 'Maximum tokens per response', '500')
    .option('--temperature <temp>', 'Temperature for responses', '0.7')
    .action(async (options) => {
      const config: CLIConfig = {
        ...DEFAULT_CONFIG,
        apiKey: options.apiKey || process.env.REQUESTY_API_KEY,
        timeout: parseInt(options.timeout),
        maxTokens: parseInt(options.maxTokens),
        temperature: parseFloat(options.temperature)
      };

      const cli = new RequestyCLI(config);
      await cli.run();
    });

  program.parse();
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };