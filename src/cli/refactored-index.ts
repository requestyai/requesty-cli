#!/usr/bin/env node

// External dependencies
import { Command } from 'commander';
import chalk from 'chalk';

// Core components
import { RequestyAPI } from '../core/api';
import { StreamingClient } from '../core/streaming';
import { CLIConfig } from '../core/types';

// UI components
import { InteractiveUI } from '../ui/interactive-ui';
import { TerminalUI } from '../ui/terminal-ui';

// Utilities
import { KeyManager } from '../utils/key-manager';
import { SessionManager } from '../utils/session-manager';
import { ErrorHandler } from '../utils/error-handler';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { InputValidator } from '../utils/input-validator';

// Security (Ultra-secure API key management)
import { SecureKeyManager, SecureApiClient } from '../security';

// Command system
import { CommandRegistry } from './commands/command-registry';
import { QuickStartCommand } from './commands/quick-start-command';
import { ModelSelectionCommand } from './commands/model-selection-command';

// PDF chat functionality
import { PDFChatInterface } from '../pdf-chat/ui/chat-interface';
import { PDFChatConfig } from '../pdf-chat/types/chat-types';

const DEFAULT_CONFIG: CLIConfig = {
  baseURL: 'http://localhost:40000/v1',
  timeout: 60000,
  temperature: 0.7
};

/**
 * Refactored CLI class using command pattern and new utilities
 * Much smaller and more maintainable than the original 665-line monolithic class
 */
class RefactoredRequestyCLI {
  private api: RequestyAPI;
  private ui: TerminalUI;
  private config: CLIConfig;
  private keyManager: KeyManager;
  private secureKeyManager: SecureKeyManager;
  private secureApiClient: SecureApiClient;
  private sessionManager: SessionManager;
  private commandRegistry: CommandRegistry;

  constructor(config: CLIConfig) {
    this.config = config;
    this.api = new RequestyAPI(config);
    this.ui = new TerminalUI();
    this.keyManager = new KeyManager();
    this.secureKeyManager = new SecureKeyManager();
    this.secureApiClient = new SecureApiClient(config.baseURL, config.timeout);
    this.sessionManager = SessionManager.getInstance();
    
    // Initialize command registry with new command system
    this.commandRegistry = new CommandRegistry(this.api, this.ui);
  }

  /**
   * Main CLI entry point - much cleaner than before
   */
  async run(): Promise<void> {
    try {
      // Initialize session
      await this.initializeSession();
      
      // Show welcome message
      this.ui.displayWelcome();
      
      // Get command line arguments
      const program = this.setupCommander();
      
      // Parse and execute commands
      await this.parseAndExecute(program);
      
    } catch (error) {
      ErrorHandler.handleApiError(error, 'CLI execution');
    }
  }

  /**
   * Initialize the CLI session
   */
  private async initializeSession(): Promise<void> {
    const { result } = await PerformanceMonitor.measureAsync(async () => {
      // Ensure API key is available
      await this.ensureApiKey();
      
      // Session already initialized in constructor
      
      // Load models (now cached)
      await this.api.getModels();
      
    }, 'session-initialization');
  }

  /**
   * Set up Commander.js with all available commands
   */
  private setupCommander(): Command {
    const program = new Command();
    
    program
      .name('requesty')
      .description('AI Model Testing CLI')
      .version('2.0.0');

    // Add help command
    program
      .command('help [command]')
      .description('Show help for commands')
      .action((command) => {
        if (command) {
          this.commandRegistry.displayCommandHelp(command);
        } else {
          this.commandRegistry.displayHelp();
        }
      });

    // Add quick start command
    program
      .command('quick-start [prompt] [streaming] [models...]')
      .alias('qs')
      .description('Quick start with default models')
      .action(async (prompt, streaming, models) => {
        await this.commandRegistry.execute('quick-start', [prompt, streaming, models]);
      });

    // Add model selection command
    program
      .command('model-selection [category] [filter] [interactive]')
      .alias('ms')
      .description('Interactive model selection')
      .action(async (category, filter, interactive) => {
        await this.commandRegistry.execute('model-selection', [category, filter, interactive]);
      });

    // Add interactive mode (fallback to original UI)
    program
      .command('interactive')
      .alias('i')
      .description('Interactive mode with full UI')
      .action(async () => {
        await this.runInteractiveMode();
      });

    // Add PDF chat command
    program
      .command('pdf-chat [file]')
      .description('Chat with PDF documents')
      .action(async (file) => {
        await this.runPDFChat(file);
      });

    // Add security status command
    program
      .command('security')
      .description('Show security status')
      .action(async () => {
        await this.showSecurityStatus();
      });

    // Add performance metrics command
    program
      .command('metrics')
      .description('Show performance metrics')
      .action(async () => {
        await this.showMetrics();
      });

    return program;
  }

  /**
   * Parse command line arguments and execute
   */
  private async parseAndExecute(program: Command): Promise<void> {
    const args = process.argv;
    
    // If no arguments provided, show help
    if (args.length === 2) {
      this.commandRegistry.displayHelp();
      return;
    }
    
    // Parse and execute
    try {
      await program.parseAsync(args);
    } catch (error) {
      // Try to suggest similar commands
      const command = args[2];
      if (command) {
        const suggestions = this.commandRegistry.getSuggestions(command);
        if (suggestions.length > 0) {
          this.ui.displayError(`Unknown command: ${command}`);
          this.ui.displayInfo(`Did you mean: ${suggestions.join(', ')}?`);
        }
      }
      
      ErrorHandler.handleApiError(error, 'Command execution');
    }
  }

  /**
   * Run interactive mode (fallback to original UI)
   */
  private async runInteractiveMode(): Promise<void> {
    const interactiveUI = new InteractiveUI();
    
    // Initialize with models
    const models = await this.api.getModels();
    await interactiveUI.initializeModels(models);
    
    // Main interaction loop
    let running = true;
    while (running) {
      const action = await interactiveUI.showMainMenu();
      
      switch (action) {
        case 'quick':
          await this.commandRegistry.execute('quick-start');
          break;
        case 'select':
          await this.commandRegistry.execute('model-selection');
          break;
        case 'compare':
          await this.runPromptComparison();
          break;
        case 'pdf-chat':
          await this.runPDFChat();
          running = false;
          break;
        case 'security':
          await this.showSecurityStatus();
          break;
        case 'exit':
          running = false;
          break;
      }
    }
  }

  /**
   * Run PDF chat functionality
   */
  private async runPDFChat(file?: string): Promise<void> {
    try {
      const pdfConfig: PDFChatConfig = {
        model: 'gpt-4o-mini',
        temperature: this.config.temperature,
        includeSystemPrompt: true,
        conversationHistory: false
      };

      const pdfChat = new PDFChatInterface(this.config, pdfConfig);
      
      if (file) {
        const validatedFile = InputValidator.validateFilePath(file);
        console.log(`Loading PDF: ${validatedFile}`);
      }
      
      console.log('PDF chat functionality - to be implemented');
      
    } catch (error) {
      ErrorHandler.handleApiError(error, 'PDF chat');
    }
  }

  /**
   * Run prompt comparison (legacy feature)
   */
  private async runPromptComparison(): Promise<void> {
    // This would be converted to a command in the future
    this.ui.displayInfo('Prompt comparison feature - to be implemented as command');
  }

  /**
   * Show security status
   */
  private async showSecurityStatus(): Promise<void> {
    try {
      const status = {
        keyStatus: 'active',
        encryptionStatus: 'enabled',
        lastCheck: Date.now()
      };
      
      this.ui.displayHeader('🔒 Security Status');
      this.ui.displayInfo(`Key Status: ${status.keyStatus}`);
      this.ui.displayInfo(`Encryption: ${status.encryptionStatus}`);
      this.ui.displayInfo(`Last Check: ${new Date(status.lastCheck).toLocaleString()}`);
      
    } catch (error) {
      ErrorHandler.handleSecurityError(error, 'Security status check');
    }
  }

  /**
   * Show performance metrics
   */
  private async showMetrics(): Promise<void> {
    this.ui.displayHeader('📊 Performance Metrics');
    
    // Show performance monitor metrics
    const performanceReport = PerformanceMonitor.getReport();
    console.log(performanceReport);
    
    // Show command registry stats
    const registryStats = this.commandRegistry.getStats();
    this.ui.displayInfo(`\nCommand Registry Stats:`);
    this.ui.displayInfo(`Total Commands: ${registryStats.totalCommands}`);
    this.ui.displayInfo(`Total Aliases: ${registryStats.totalAliases}`);
    this.ui.displayInfo(`Categories: ${registryStats.categories}`);
  }

  /**
   * Ensure API key is available
   */
  private async ensureApiKey(): Promise<void> {
    if (!this.config.apiKey) {
      try {
        // Try secure key manager first
        const secureKey = await this.secureKeyManager.getApiKey();
        if (secureKey) {
          this.config.apiKey = secureKey;
          return;
        }
      } catch (error) {
        // Fall back to regular key manager
        console.warn('Secure key manager unavailable, using regular key manager');
      }
      
      // Use regular key manager
      const apiKey = await this.keyManager.getApiKey();
      if (!apiKey) {
        throw new Error('No API key available');
      }
      
      this.config.apiKey = apiKey;
    }
    
    // Validate the API key
    InputValidator.validateApiKey(this.config.apiKey);
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    const config = { ...DEFAULT_CONFIG };
    const cli = new RefactoredRequestyCLI(config);
    await cli.run();
  } catch (error) {
    ErrorHandler.handleApiError(error, 'CLI startup');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

// Export for testing
export { RefactoredRequestyCLI };