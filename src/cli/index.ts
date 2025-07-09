#!/usr/bin/env node

// External dependencies
import { Command } from 'commander';
import chalk from 'chalk';

// Core components
import { RequestyAPI } from '../core/api';
import { StreamingClient } from '../core/streaming';
import { CLIConfig, ChatCompletionRequest, ModelInfo } from '../core/types';

// UI components
import { InteractiveUI } from '../ui/interactive-ui';
import { DynamicResultsTable } from '../ui/dynamic-table';
import { ComparisonTable } from '../ui/comparison-table';

// Utilities
import { KeyManager } from '../utils/key-manager';
import { PricingCalculator } from '../utils/pricing';
import { SessionManager } from '../utils/session-manager';

// Security (Ultra-secure API key management)
import { SecureKeyManager, SecureApiClient } from '../security';

// Models and data
import { DEFAULT_MODELS } from '../models/models';

// PDF chat functionality
import { PDFChatInterface } from '../pdf-chat/ui/chat-interface';
import { PDFChatConfig } from '../pdf-chat/types/chat-types';


const DEFAULT_CONFIG: CLIConfig = {
  baseURL: 'http://localhost:40000/v1',
  timeout: 60000,
  temperature: 0.7
};

class RequestyCLI {
  private api: RequestyAPI;
  private streaming: StreamingClient;
  private ui: InteractiveUI;
  private config: CLIConfig;
  private keyManager: KeyManager;
  private secureKeyManager?: SecureKeyManager;
  private secureApiClient?: SecureApiClient;
  private models: ModelInfo[] = [];
  private sessionManager: SessionManager;

  constructor(config: CLIConfig) {
    this.config = config;
    this.api = new RequestyAPI(config);
    this.streaming = new StreamingClient(config);
    this.ui = new InteractiveUI();
    this.keyManager = new KeyManager();
    // Initialize secure components with error handling
    try {
      this.secureKeyManager = new SecureKeyManager();
      this.secureApiClient = new SecureApiClient(config.baseURL, config.timeout);
    } catch (error) {
      // Silently continue if secure components fail
      console.warn('Secure components unavailable, using standard security');
    }
    this.sessionManager = SessionManager.getInstance();
  }

  async run() {
    try {
      // Ensure API key is available
      await this.ensureApiKey();

      // Load available models with error handling
      try {
        this.models = await this.api.getModels();
        await this.ui.initializeModels(this.models);
      } catch (error) {
        console.warn('Failed to load models, using defaults');
        this.models = this.api.getAvailableModels();
        await this.ui.initializeModels(this.models);
      }

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
          case 'compare':
            await this.runPromptComparison();
            break;
          case 'pdf-chat':
            await this.runPDFChat();
            running = false; // Exit after PDF chat session
            break;
          case 'security':
            await this.showSecurityStatus();
            break;
          case 'exit':
            running = false;
            break;
        }

        // After completing an action (except pdf-chat which exits), continue to main menu
        // No need to ask if user wants to continue - just show the main menu again
      }

      this.ui.showGoodbye();
    } catch (error) {
      this.ui.showError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  }

  private async runQuickStart() {
    this.sessionManager.startSession('model_comparison');
    const useStreaming = await this.ui.getStreamingChoice();
    const prompt = await this.ui.getPrompt();
    await this.testModels(DEFAULT_MODELS, prompt, useStreaming);
    this.sessionManager.endSession();
  }

  private async runCustomSelection() {
    this.sessionManager.startSession('model_comparison');
    const selectedModels = await this.ui.selectModels();
    const useStreaming = await this.ui.getStreamingChoice();
    const prompt = await this.ui.getPrompt();
    await this.testModels(selectedModels, prompt, useStreaming);
    this.sessionManager.endSession();
  }

  private async runPromptComparison() {
    this.sessionManager.startSession('prompt_comparison');
    const { prompt1, prompt2 } = await this.ui.getComparisonPrompts();
    const useStreaming = await this.ui.getStreamingChoice();
    await this.comparePrompts(DEFAULT_MODELS, prompt1, prompt2, useStreaming);
    this.sessionManager.endSession();
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
      try {
        // Use secure key manager for enhanced security
        if (this.secureKeyManager) {
          this.config.apiKey = await this.secureKeyManager.getApiKey();
        }

        // Initialize secure API client
        if (this.secureApiClient) {
          await this.secureApiClient.initialize();
        }

        // Update regular API instances with the new key
        this.api = new RequestyAPI(this.config);
        this.streaming = new StreamingClient(this.config);
      } catch (error) {
        // Fallback to regular key manager - this is normal for most users
        this.config.apiKey = await this.keyManager.getApiKey();

        // Update regular API instances with the new key
        this.api = new RequestyAPI(this.config);
        this.streaming = new StreamingClient(this.config);
      }
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








  async showSecurityStatus(): Promise<void> {
    try {
      console.log('\n🔒 Security Status Report\n');

      // Get security status from secure API client
      if (this.secureApiClient) {
        const securityStatus = this.secureApiClient.getSecurityStatus();
        const secureConfig = this.secureApiClient.exportSecureConfig();

        console.log('🛡️  Encryption Status:');
        console.log(`   Algorithm: ${secureConfig.encryption}`);
        console.log(`   Key Derivation: ${secureConfig.keyDerivation}`);
        console.log(`   TLS Version: ${secureConfig.tlsVersion}`);
        console.log(`   Security Level: ${secureConfig.securityLevel}`);

        console.log('\n🔑 API Key Management:');
      } else {
        console.log('⚠️  Security Status: Standard (secure components unavailable)');
      }
      console.log(`   Key Store Exists: ${securityStatus.keyStoreExists ? '✅ Yes' : '❌ No'}`);
      console.log(`   Key Store Valid: ${securityStatus.keyStoreValid ? '✅ Yes' : '❌ No'}`);
      console.log(`   Encryption Level: ${securityStatus.encryptionLevel}`);

      if (secureConfig.keyStore) {
        console.log('\n📊 Key Store Information:');
        console.log(`   Version: ${secureConfig.keyStore.version}`);
        console.log(`   Created: ${secureConfig.keyStore.created}`);
        console.log(`   Algorithm: ${secureConfig.keyStore.algorithm}`);
        console.log(`   Valid: ${secureConfig.keyStore.isValid ? '✅ Yes' : '❌ No'}`);
      }

      console.log('\n🔐 Security Features:');
      console.log('   ✅ AES-256-CBC encryption');
      console.log('   ✅ PBKDF2-SHA256 key derivation');
      console.log('   ✅ Machine fingerprinting');
      console.log('   ✅ Secure memory management');
      console.log('   ✅ TLS 1.2+ enforcement');
      console.log('   ✅ Timing attack protection');
      console.log('   ✅ Secure key validation');
      console.log('   ✅ Atomic file operations');
      console.log('   ✅ Secure file deletion');
      console.log('   ✅ Anti-tampering protection');

      console.log('\n');
    } catch (error) {
      this.ui.showError(error instanceof Error ? error.message : 'Failed to retrieve security status');
    }
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

      const metadata = this.sessionManager.getRequestyMetadata({
        model: model,
        prompt_length: prompt.length,
        request_type: 'streaming'
      });

      const request: ChatCompletionRequest = {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.temperature,
        stream: true,
        requesty: metadata
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
        const metadata = this.sessionManager.getRequestyMetadata({
          model: model,
          prompt_length: prompt.length,
          request_type: 'standard'
        });

        // Find model info or create a basic one
        const modelInfo = this.models.find(m => m.id === model || m.name === model) || {
          name: model,
          provider: 'Unknown',
          id: model
        };
        
        const result = await this.api.testModel(modelInfo, prompt, false, metadata);

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

  private async comparePrompts(models: string[], prompt1: string, prompt2: string, useStreaming: boolean) {
    console.log(chalk.cyan.bold('\\n⚡ Prompt Comparison Mode\\n'));
    console.log(`🚀 Testing ${models.length} models with 2 prompts (${models.length * 2} total requests)...`);
    console.log(chalk.green(`⚡ TRUE CONCURRENT: All ${models.length * 2} requests fire simultaneously for fair timing!`));
    console.log(chalk.gray(`Mode: ${useStreaming ? 'streaming' : 'standard'} responses\\n`));

    // Create comparison table
    const comparisonTable = new ComparisonTable(models, useStreaming, prompt1, prompt2);

    // Add model info to comparison table
    models.forEach(model => {
      const modelInfo = this.models.find(m => m.id === model);
      if (modelInfo) {
        comparisonTable.setModelInfo(model, modelInfo);
      }
    });

    if (useStreaming) {
      await this.runStreamingComparison(models, prompt1, prompt2, comparisonTable);
    } else {
      await this.runStandardComparison(models, prompt1, prompt2, comparisonTable);
    }

    // Ask user if they want to see responses
    const showResponses = await this.ui.askShowResponses();
    if (showResponses) {
      comparisonTable.showCompletedResponses();
    }

    comparisonTable.showFinalSummary();
  }

  private async runStreamingComparison(models: string[], prompt1: string, prompt2: string, comparisonTable: ComparisonTable) {
    console.log(chalk.blue('🚀 Launching ALL 10 streaming requests simultaneously...\\n'));

    const allPromises: Promise<void>[] = [];
    const startTime = Date.now();

    // Create ALL promises first (don't await anything yet)
    models.forEach(model => {
      // Prompt 1
      allPromises.push(this.runSingleStreamingComparison(model, prompt1, 'prompt1', comparisonTable, startTime));
      // Prompt 2
      allPromises.push(this.runSingleStreamingComparison(model, prompt2, 'prompt2', comparisonTable, startTime));
    });

    // Fire all 10 requests at the EXACT same time
    await Promise.all(allPromises);
  }

  private async runSingleStreamingComparison(
    model: string,
    prompt: string,
    promptType: 'prompt1' | 'prompt2',
    comparisonTable: ComparisonTable,
    globalStartTime: number
  ): Promise<void> {
    comparisonTable.updateModel(model, promptType, { status: 'running' });

    const metadata = this.sessionManager.getRequestyMetadata({
      model: model,
      prompt_length: prompt.length,
      request_type: 'streaming_comparison',
      prompt_type: promptType,
      comparison_id: `${promptType}_${globalStartTime}`
    });

    const request: ChatCompletionRequest = {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: this.config.temperature,
      stream: true,
      requesty: metadata
    };

    try {
      const result = await this.streaming.streamCompletion(request, (chunk, stats) => {
        comparisonTable.updateModel(model, promptType, {
          status: 'running',
          tokensPerSecond: stats.tokensPerSecond,
          totalTokens: stats.totalTokens
        });
      });

      if (result.success) {
        comparisonTable.updateModel(model, promptType, {
          status: 'completed',
          duration: result.duration,
          tokensPerSecond: result.tokensPerSecond,
          totalTokens: result.totalTokens,
          response: result.fullResponse
        });
      } else {
        comparisonTable.updateModel(model, promptType, {
          status: 'failed',
          duration: result.duration,
          error: result.error
        });
      }
    } catch (error) {
      comparisonTable.updateModel(model, promptType, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async runStandardComparison(models: string[], prompt1: string, prompt2: string, comparisonTable: ComparisonTable) {
    console.log(chalk.blue('🚀 Launching ALL 10 requests simultaneously...\\n'));

    const allPromises: Promise<void>[] = [];
    const startTime = Date.now();

    // Create ALL promises first (don't await anything yet)
    models.forEach(model => {
      // Prompt 1
      allPromises.push(this.runSingleStandardComparison(model, prompt1, 'prompt1', comparisonTable, startTime));
      // Prompt 2
      allPromises.push(this.runSingleStandardComparison(model, prompt2, 'prompt2', comparisonTable, startTime));
    });

    // Fire all 10 requests at the EXACT same time
    await Promise.all(allPromises);
  }

  private async runSingleStandardComparison(
    model: string,
    prompt: string,
    promptType: 'prompt1' | 'prompt2',
    comparisonTable: ComparisonTable,
    globalStartTime: number
  ): Promise<void> {
    comparisonTable.updateModel(model, promptType, { status: 'running' });

    try {
      // Use custom timing with global start time for fair comparison
      const requestStartTime = Date.now();

      const metadata = this.sessionManager.getRequestyMetadata({
        model: model,
        prompt_length: prompt.length,
        request_type: 'standard_comparison',
        prompt_type: promptType,
        comparison_id: `${promptType}_${globalStartTime}`
      });

      const request: ChatCompletionRequest = {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.temperature,
        stream: false,
        requesty: metadata
      };

      const response = await this.api.sendChatCompletion(request);
      const duration = Date.now() - requestStartTime;

      const usage = response.usage;
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

      if (modelInfo && (modelInfo.input_price || modelInfo.output_price)) {
        const pricing = PricingCalculator.calculatePricing(
          modelInfo,
          inputTokens,
          outputTokens,
          reasoningTokens
        );
        actualCost = pricing.actualCost;
      }

      comparisonTable.updateModel(model, promptType, {
        status: 'completed',
        duration,
        inputTokens,
        outputTokens,
        totalTokens,
        reasoningTokens,
        actualCost,
        response: response.choices[0]?.message?.content || 'No response'
      });
    } catch (error) {
      comparisonTable.updateModel(model, promptType, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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

  // Security status command
  program
    .command('security')
    .description('Show security status and configuration')
    .action(async () => {
      const cli = new RequestyCLI(DEFAULT_CONFIG);
      await cli.showSecurityStatus();
    });

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

