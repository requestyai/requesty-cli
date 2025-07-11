#!/usr/bin/env node

/**
 * @fileoverview Main CLI entry point - now using modular orchestrator pattern
 * @author Requesty CLI Team
 * @license MIT
 * @copyright 2024 Requesty CLI Contributors
 */

// External dependencies
import { Command } from 'commander';

// Core components
import type { ChatConfig } from '../chat/types/chat-types';
import { RequestyAPI } from '../core/api';
import { CLIConfig, ModelInfo } from '../core/types';

// Orchestrator
import { CLIOrchestrator } from './core/cli-orchestrator';

// PDF chat functionality
import { PDFChatConfig } from '../pdf-chat/types/chat-types';
import { PDFChatInterface } from '../pdf-chat/ui/chat-interface';

/**
 * Default configuration for the CLI
 */
const DEFAULT_CONFIG: CLIConfig = {
  baseURL: 'https://router.requesty.ai/v1',
  timeout: 60000,
  temperature: 0.7,
  apiKey: process.env.REQUESTY_API_KEY,
};

/**
 * Legacy RequestyCLI class - now uses orchestrator pattern
 * @deprecated Use CLIOrchestrator directly
 */
class RequestyCLI {
  private orchestrator: CLIOrchestrator;

  constructor(config: CLIConfig) {
    this.orchestrator = new CLIOrchestrator(config);
  }

  /**
   * Run the CLI application
   * @deprecated Use orchestrator.run() directly
   */
  async run() {
    await this.orchestrator.run();
  }

  /**
   * Show security status
   * @deprecated Use orchestrator security manager
   */
  async showSecurityStatus(): Promise<void> {
    const orchestrator = new CLIOrchestrator(DEFAULT_CONFIG);
    await orchestrator.run();
  }
}

/**
 * Helper function to create PDF chat configuration
 * @param model - AI model to use
 * @param temperature - Temperature setting
 * @returns PDF chat configuration object
 */
function createPDFChatConfig(
  model: string,
  temperature: number
): PDFChatConfig {
  return {
    model,
    temperature,
    includeSystemPrompt: true,
    conversationHistory: true,
  };
}

/**
 * Main CLI entry point
 * @returns Promise that resolves when CLI completes
 */
async function main(): Promise<void> {
  const program = new Command();

  program
    .name('requesty')
    .description('Interactive AI Model Testing CLI with Streaming')
    .version('1.0.0')
    .exitOverride() // Don't call process.exit() directly
    .configureOutput({
      writeErr: (str) => process.stderr.write(str),
      writeOut: (str) => process.stdout.write(str),
    });

  // Security status command
  program
    .command('security')
    .description('Show security status and configuration')
    .action(async () => {
      const orchestrator = new CLIOrchestrator(DEFAULT_CONFIG);
      await orchestrator.handleSecurityStatus();
    });

  // Chat command
  program
    .command('chat')
    .description('Start an interactive AI chat session')
    .argument('[model]', 'Optional model ID to use (e.g., "openai/gpt-4o")')
    .option('-k, --api-key <key>', 'API key for authentication')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '60000')
    .option('--temperature <temp>', 'Temperature for responses', '0.7')
    .action(async (model, options) => {
      const config: CLIConfig = {
        ...DEFAULT_CONFIG,
        apiKey: options.apiKey || process.env.REQUESTY_API_KEY,
        timeout: parseInt(options.timeout),
        temperature: parseFloat(options.temperature),
      };

      // Import chat interface and types
      const { ChatInterface } = await import('../chat/ui/chat-interface');
      const { getDefaultChatModel, DEFAULT_SYSTEM_PROMPT } = await import(
        '../chat/config/featured-models'
      );

      // Create API client to get models
      const api = new RequestyAPI(config);
      let allModels: ModelInfo[] = [];

      try {
        allModels = await api.getModels();
      } catch (error) {
        console.warn(
          '⚠️  Failed to fetch models from API, continuing without recent models'
        );
      }

      // Create chat configuration
      const chatConfig: ChatConfig = {
        model: model || getDefaultChatModel(),
        temperature: parseFloat(options.temperature),
        includeSystemPrompt: true,
        conversationHistory: true,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
      };

      // Create and start chat interface
      const chatInterface = new ChatInterface(config, chatConfig, allModels);
      await chatInterface.start();
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
        temperature: parseFloat(options.temperature),
      };

      // Create PDF chat configuration and interface
      const pdfChatConfig = createPDFChatConfig(
        options.model,
        parseFloat(options.temperature)
      );
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
        temperature: parseFloat(options.temperature),
      };

      const orchestrator = new CLIOrchestrator(config);
      await orchestrator.run();
    });

  try {
    program.parse();
  } catch (err: any) {
    // Handle Commander.js errors properly
    if (err.code === 'commander.unknownCommand') {
      console.error(`Unknown command: ${err.message}`);
      process.exit(1);
    } else if (err.code === 'commander.help') {
      process.exit(0);
    } else if (err.code === 'commander.version') {
      process.exit(0);
    } else {
      console.error('Error:', err.message);
      process.exit(1);
    }
  }
}

// Export legacy class for backwards compatibility
export { RequestyCLI };

// Run main function if this is the entry point
if (require.main === module) {
  main().catch(console.error);
}

export { main };
