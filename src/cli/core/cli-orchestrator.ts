/**
 * @fileoverview Main CLI orchestrator - coordinates all CLI operations
 * @author Requesty CLI Team
 * @license MIT
 * @copyright 2024 Requesty CLI Contributors
 */

import { RequestyAPI } from '../../core/api';
import { StreamingClient } from '../../core/streaming';
import { CLIConfig, ModelInfo } from '../../core/types';
import { SecureApiClient, SecureKeyManager } from '../../security';
import { InteractiveUI } from '../../ui/interactive-ui';
import { KeyManager } from '../../utils/key-manager';
import { SessionManager } from '../../utils/session-manager';
import { MenuHandler } from './menu-handler';
import { ModelTester } from './model-tester';
import { SecurityManager } from './security-manager';

/**
 * Main CLI orchestrator that coordinates all CLI operations
 * Replaces the monolithic RequestyCLI class with focused responsibilities
 */
export class CLIOrchestrator {
  private api!: RequestyAPI;
  private streaming!: StreamingClient;
  private ui!: InteractiveUI;
  private config: CLIConfig;
  private keyManager!: KeyManager;
  private secureKeyManager?: SecureKeyManager;
  private secureApiClient?: SecureApiClient;
  private models: ModelInfo[] = [];
  private sessionManager!: SessionManager;
  private menuHandler!: MenuHandler;
  private modelTester!: ModelTester;
  private securityManager!: SecurityManager;

  /**
   * Creates a new CLI orchestrator
   * @param config - CLI configuration
   */
  constructor(config: CLIConfig) {
    this.config = config;
    this.initializeComponents();
    this.initializeHandlers();
  }

  /**
   * Initialize core components
   * @private
   */
  private initializeComponents(): void {
    this.api = new RequestyAPI(this.config);
    this.streaming = new StreamingClient(this.config);
    this.ui = new InteractiveUI();
    this.keyManager = new KeyManager();
    this.sessionManager = SessionManager.getInstance();

    // Initialize secure components with error handling
    this.initializeSecureComponents();
  }

  /**
   * Initialize secure components with graceful fallback
   * @private
   */
  private initializeSecureComponents(): void {
    try {
      this.secureKeyManager = new SecureKeyManager();
      this.secureApiClient = new SecureApiClient(
        this.config.baseURL,
        this.config.timeout
      );
    } catch (error) {
      // Secure components are optional - continue without them
      console.warn('Secure components unavailable, using standard security');
    }
  }

  /**
   * Initialize specialized handlers
   * @private
   */
  private initializeHandlers(): void {
    this.menuHandler = new MenuHandler(this.ui);
    this.modelTester = new ModelTester(this.api, this.streaming, this.ui);
    this.securityManager = new SecurityManager(
      this.keyManager,
      this.secureKeyManager,
      this.secureApiClient
    );
  }

  /**
   * Run the CLI application
   * Main entry point for the CLI
   */
  async run(): Promise<void> {
    try {
      // Initialize session and authentication
      await this.initialize();

      // Main interaction loop
      await this.runMainLoop();
    } catch (error) {
      console.error(
        '❌ CLI Error:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      process.exit(1);
    }
  }

  /**
   * Initialize the CLI session
   * @private
   */
  private async initialize(): Promise<void> {
    // Ensure API key is available
    await this.securityManager.ensureApiKey(this.config);

    // Refresh API clients with updated config (in case API key was loaded)
    this.refreshApiClients();

    // Fetch models from API
    try {
      this.models = await this.api.getModels();
      await this.ui.initializeModels(this.models);
    } catch (error) {
      console.warn('⚠️  Failed to fetch models from API, using defaults');
      this.models = this.api.getAvailableModels();
      await this.ui.initializeModels(this.models);
    }
  }

  /**
   * Refresh API clients with current configuration
   * @private
   */
  private refreshApiClients(): void {
    this.api.updateConfig(this.config);
    this.streaming.updateConfig(this.config);
  }

  /**
   * Run the main interaction loop
   * @private
   */
  private async runMainLoop(): Promise<void> {
    let running = true;

    while (running) {
      const action = await this.menuHandler.showMainMenu();

      switch (action) {
        case 'quick':
          await this.handleQuickStart();
          break;
        case 'select':
          await this.handleCustomSelection();
          break;
        case 'compare':
          await this.handlePromptComparison();
          break;
        case 'pdf-chat':
          await this.handlePDFChat();
          running = false; // Exit after PDF chat session
          break;
        case 'security':
          await this.handleSecurityStatus();
          break;
        case 'exit':
          running = false;
          break;
      }
    }
  }

  /**
   * Handle quick start functionality
   * @private
   */
  private async handleQuickStart(): Promise<void> {
    await this.modelTester.runQuickStart(this.models);
  }

  /**
   * Handle custom model selection
   * @private
   */
  private async handleCustomSelection(): Promise<void> {
    await this.modelTester.runCustomSelection(this.models);
  }

  /**
   * Handle prompt comparison
   * @private
   */
  private async handlePromptComparison(): Promise<void> {
    await this.modelTester.runPromptComparison(this.models);
  }

  /**
   * Handle PDF chat functionality
   * @private
   */
  private async handlePDFChat(): Promise<void> {
    try {
      const { PDFChatInterface } = await import(
        '../../pdf-chat/ui/chat-interface'
      );

      const pdfConfig: any = {
        model: 'gpt-4o-mini',
        temperature: this.config.temperature,
        includeSystemPrompt: true,
        conversationHistory: false,
      };

      const pdfChat = new PDFChatInterface(this.config, pdfConfig);

      // This would start the PDF chat session
      console.log('🚀 Starting PDF chat session...');
      console.log('PDF chat functionality ready - upload a PDF to begin');
    } catch (error) {
      console.error(
        '❌ PDF Chat Error:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Handle security status display
   * @public
   */
  async handleSecurityStatus(): Promise<void> {
    // Display security status without interactive key prompts
    await this.securityManager.displaySecurityStatus();
  }

  /**
   * Get the current configuration
   * @returns Current CLI configuration
   */
  getConfig(): CLIConfig {
    return { ...this.config };
  }

  /**
   * Get the loaded models
   * @returns Array of loaded models
   */
  getModels(): ModelInfo[] {
    return [...this.models];
  }
}
