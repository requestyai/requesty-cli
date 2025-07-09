#!/usr/bin/env node

// External dependencies
import { Command } from 'commander';

// Core components
import { RequestyAPI } from '../core/api';
import { StreamingClient } from '../core/streaming';
import { CLIConfig, ChatCompletionRequest, ModelInfo } from '../core/types';

// UI components
import { InteractiveUI } from '../ui/interactive-ui';
import { DynamicResultsTable } from '../ui/dynamic-table';

// Utilities
import { KeyManager } from '../utils/key-manager';
import { PricingCalculator } from '../utils/pricing';

// Models and data
import { DEFAULT_MODELS } from '../models/models';

// PDF chat functionality
import { PDFChatInterface } from '../pdf-chat/ui/chat-interface';
import { PDFChatConfig } from '../pdf-chat/types/chat-types';

const DEFAULT_CONFIG: CLIConfig = {
  baseURL: 'https://router.requesty.ai/v1',
  timeout: 60000,
  temperature: 0.7
};

class RequestyCLI {
  private api: RequestyAPI;
  private streaming: StreamingClient;
  private ui: InteractiveUI;
  private config: CLIConfig;
  private keyManager: KeyManager;
  private models: ModelInfo[] = [];

  constructor(config: CLIConfig) {
    this.config = config;
    this.api = new RequestyAPI(config);
    this.streaming = new StreamingClient(config);
    this.ui = new InteractiveUI();
    this.keyManager = new KeyManager();
  }

  async run() {
    try {
      // Ensure API key is available
      await this.ensureApiKey();

      // Load available models
      this.models = await this.api.getModels();
      await this.ui.initializeModels(this.models);

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
          case 'pdf-chat':
            await this.runPDFChat();
            running = false; // Exit after PDF chat session
            break;
          case 'exit':
            running = false;
            break;
        }

        if (running && action !== 'pdf-chat') {
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

  private async runPDFChat(): Promise<void> {
    try {
      await this.ensureApiKey();
      
      const pdfPath = await this.ui.getPDFPath();
      const model = await this.ui.getPDFModel();
      
      const pdfChatConfig = this.createPDFChatConfig(model);
      const pdfChatInterface = new PDFChatInterface(this.config, pdfChatConfig);
      
      await pdfChatInterface.start(pdfPath);
    } catch (error) {
      this.ui.showError(error instanceof Error ? error.message : 'Failed to start PDF chat');
    }
  }

  private async ensureApiKey(): Promise<void> {
    if (!this.config.apiKey || this.config.apiKey === '<REQUESTY_API_KEY>') {
      this.config.apiKey = await this.keyManager.getApiKey();
      // Update API instances with the new key
      this.api = new RequestyAPI(this.config);
      this.streaming = new StreamingClient(this.config);
    }
  }

  private createPDFChatConfig(model: string): PDFChatConfig {
    return {
      model,
      temperature: this.config.temperature,
      includeSystemPrompt: true,
      conversationHistory: true
    };
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

    // Ask user if they want to see responses
    const showResponses = await this.ui.askShowResponses();
    if (showResponses) {
      resultsTable.showCompletedResponses();
    }

    // Ask user if they want to see raw debug data
    const showRawDebug = await this.ui.askShowRawDebug();
    if (showRawDebug) {
      resultsTable.showRawResponseDebug();
    }
    
    resultsTable.showFinalSummary();
  }

  private async runStreamingTests(models: string[], prompt: string, resultsTable: DynamicResultsTable) {
    const concurrentPromises = models.map(async (model) => {
      resultsTable.updateModel(model, { status: 'running' });

      const request: ChatCompletionRequest = {
        model,
        messages: [{ role: 'user', content: prompt }],
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
          const inputTokens = usage?.prompt_tokens || 0;
          const outputTokens = usage?.completion_tokens || 0;
          const totalTokens = usage?.total_tokens || 0;
          const reasoningTokens = totalTokens > 0 && inputTokens > 0 && outputTokens > 0 
            ? totalTokens - inputTokens - outputTokens 
            : 0;
          
          // Find model info for pricing
          const modelInfo = this.models.find(m => m.id === model);
          
          // Calculate pricing
          let actualCost = 0;
          let blendedCostPerMillion = 0;
          
          if (modelInfo && (modelInfo.input_price || modelInfo.output_price)) {
            const pricing = PricingCalculator.calculatePricing(
              modelInfo,
              inputTokens,
              outputTokens,
              reasoningTokens
            );
            actualCost = pricing.actualCost;
            blendedCostPerMillion = pricing.blendedCostPerMillion;
          }
          
          resultsTable.updateModel(model, {
            status: 'completed',
            duration: result.duration,
            inputTokens,
            outputTokens,
            totalTokens,
            reasoningTokens,
            actualCost,
            blendedCostPerMillion,
            modelInfo,
            response: result.response.choices[0]?.message?.content || 'No response',
            rawResponse: result.rawResponse
          });
        } else {
          resultsTable.updateModel(model, {
            status: 'failed',
            duration: result.duration,
            error: result.error,
            rawResponse: result.rawResponse
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

// Helper function to create PDF chat configuration
function createPDFChatConfig(model: string, temperature: number): PDFChatConfig {
  return {
    model,
    temperature,
    includeSystemPrompt: true,
    conversationHistory: true
  };
}

async function main(): Promise<void> {
  const program = new Command();
  
  program
    .name('requesty')
    .description('Interactive AI Model Testing CLI with Streaming')
    .version('2.0.0');

  // PDF Chat command
  program
    .command('pdf-chat')
    .description('Chat with a PDF document using AI')
    .argument('<pdf-path>', 'Path to the PDF file to chat with')
    .option('-m, --model <model>', 'AI model to use for chat', 'openai/gpt-4o')
    .option('-k, --api-key <key>', 'API key for authentication')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '60000')
    .option('--temperature <temp>', 'Temperature for responses', '0.7')
    .action(async (pdfPath, options) => {
      const config: CLIConfig = {
        ...DEFAULT_CONFIG,
        apiKey: options.apiKey || process.env.REQUESTY_API_KEY,
        timeout: parseInt(options.timeout),
        temperature: parseFloat(options.temperature)
      };

      // Create PDF chat configuration and interface
      const pdfChatConfig = createPDFChatConfig(options.model, parseFloat(options.temperature));
      const pdfChatInterface = new PDFChatInterface(config, pdfChatConfig);
      
      await pdfChatInterface.start(pdfPath);
    });

  // Default command (original functionality)
  program
    .option('-k, --api-key <key>', 'API key for authentication')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '60000')
    .option('--temperature <temp>', 'Temperature for responses', '0.7')
    .action(async (options) => {
      const config: CLIConfig = {
        ...DEFAULT_CONFIG,
        apiKey: options.apiKey || process.env.REQUESTY_API_KEY,
        timeout: parseInt(options.timeout),
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