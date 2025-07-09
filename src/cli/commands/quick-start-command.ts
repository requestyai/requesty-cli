import { BaseCommand } from './base-command';
import { RequestyAPI } from '../../core/api';
import { TerminalUI } from '../../ui/terminal-ui';
import { ModelInfo } from '../../core/types';
import { ErrorHandler } from '../../utils/error-handler';
import { InputValidator } from '../../utils/input-validator';

/**
 * Quick start command for rapid model testing
 * Provides immediate model comparison with minimal setup
 */
export class QuickStartCommand extends BaseCommand {
  private api: RequestyAPI;
  private ui: TerminalUI;

  constructor(api: RequestyAPI, ui: TerminalUI) {
    super('quick-start', 'Quickly test multiple AI models with a single prompt');
    this.api = api;
    this.ui = ui;
  }

  /**
   * Execute the quick start command
   * @param args - Command arguments [prompt, streaming?, models?]
   * @returns Promise that resolves when command completes
   */
  protected async run(args: any[]): Promise<any> {
    try {
      // Extract and validate arguments
      const { prompt, streaming, models } = this.parseArgs(args);
      
      // Get models to test
      const modelsToTest = await this.getModelsToTest(models);
      
      // Display welcome message
      await this.displayWelcome();
      
      // Test models concurrently
      const results = await this.testModels(prompt, modelsToTest, streaming);
      
      // Display results
      await this.displayResults(results);
      
      return this.createResult(true, results, 'Quick start completed successfully');
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Quick start command');
    }
  }

  /**
   * Parse command arguments
   * @param args - Raw command arguments
   * @returns Parsed and validated arguments
   */
  private parseArgs(args: any[]): QuickStartArgs {
    const [prompt, streaming, models] = args;
    
    // Validate prompt
    const validatedPrompt = prompt 
      ? InputValidator.validatePrompt(prompt)
      : null;
    
    // Validate streaming flag
    const isStreaming = streaming === 'true' || streaming === true;
    
    // Validate models array
    const validatedModels = models && Array.isArray(models)
      ? this.validateArray(models, 'models', 1, 10)
      : null;

    return {
      prompt: validatedPrompt,
      streaming: isStreaming,
      models: validatedModels
    };
  }

  /**
   * Get models to test
   * @param requestedModels - Specific models requested or null for defaults
   * @returns Array of models to test
   */
  private async getModelsToTest(requestedModels: string[] | null): Promise<ModelInfo[]> {
    if (requestedModels) {
      // Use specified models
      const models = requestedModels
        .map(name => this.api.getModelByName(name))
        .filter((model): model is ModelInfo => model !== null);
      return models;
    }

    // Use default quick start models
    const defaultModels = [
      'gpt-4o-mini',
      'gpt-4o',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'gemini-1.5-flash'
    ];

    const models = defaultModels
      .map(name => this.api.getModelByName(name))
      .filter((model): model is ModelInfo => model !== null);
    
    // If no models found, use defaults
    if (models.length === 0) {
      return this.api.getAvailableModels().slice(0, 5);
    }
    
    return models;
  }

  /**
   * Display welcome message
   */
  private async displayWelcome(): Promise<void> {
    this.ui.displayHeader('🚀 Quick Start - AI Model Testing');
    this.ui.displayInfo('Testing multiple AI models with your prompt...');
  }

  /**
   * Test models concurrently
   * @param prompt - Prompt to test
   * @param models - Models to test
   * @param streaming - Whether to use streaming
   * @returns Array of test results
   */
  private async testModels(
    prompt: string | null,
    models: ModelInfo[],
    streaming: boolean
  ): Promise<QuickStartResult[]> {
    // Get prompt from user if not provided
    const testPrompt = prompt || await this.ui.getPrompt();
    
    // Validate final prompt
    const validatedPrompt = InputValidator.validatePrompt(testPrompt);
    
    // Show testing progress
    this.ui.displayInfo(`Testing ${models.length} models...`);
    
    // Test models concurrently
    const promises = models.map(async (model) => {
      try {
        const result = await this.api.testModel(model, validatedPrompt, streaming);
        return {
          model: model.name,
          success: true,
          result,
          error: null
        };
      } catch (error) {
        return {
          model: model.name,
          success: false,
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Display test results
   * @param results - Test results to display
   */
  private async displayResults(results: QuickStartResult[]): Promise<void> {
    this.ui.displayHeader('📊 Quick Start Results');
    
    // Separate successful and failed results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    // Display successful results
    if (successful.length > 0) {
      this.ui.displayTable(successful.map(r => ({
        Model: r.model,
        'Response Time': `${r.result?.duration || 0}ms`,
        'Tokens': r.result?.usage?.total_tokens || 0,
        'Cost': r.result?.cost ? `$${r.result.cost.toFixed(4)}` : 'N/A',
        'Status': '✅ Success'
      })));
    }
    
    // Display failed results
    if (failed.length > 0) {
      this.ui.displayError('\n❌ Failed Tests:');
      failed.forEach(r => {
        this.ui.displayError(`${r.model}: ${r.error}`);
      });
    }
    
    // Display summary
    this.ui.displayInfo(`\n📈 Summary: ${successful.length} successful, ${failed.length} failed`);
  }

  /**
   * Display command-specific help
   */
  protected displaySpecificHelp(): void {
    console.log(`
Options:
  [prompt]     Optional prompt to test (will prompt if not provided)
  [streaming]  Use streaming responses (true/false, default: false)
  [models]     Comma-separated list of models to test (optional)

Examples:
  requesty quick-start
  requesty quick-start "Hello, world!"
  requesty quick-start "Hello, world!" true
  requesty quick-start "Hello, world!" false "gpt-4o,claude-3-5-sonnet"

Default models: gpt-4o-mini, gpt-4o, claude-3-5-sonnet, claude-3-5-haiku, gemini-1.5-flash
`);
  }

  /**
   * Get command category
   * @returns Command category
   */
  protected getCategory(): string {
    return 'testing';
  }

  /**
   * Check if command requires authentication
   * @returns True if authentication required
   */
  protected requiresAuthentication(): boolean {
    return true;
  }

  /**
   * Check if command requires user interaction
   * @returns True if user interaction required
   */
  protected requiresUserInteraction(): boolean {
    return true;
  }
}

/**
 * Quick start arguments interface
 */
interface QuickStartArgs {
  prompt: string | null;
  streaming: boolean;
  models: string[] | null;
}

/**
 * Quick start result interface
 */
interface QuickStartResult {
  model: string;
  success: boolean;
  result: any;
  error: string | null;
}