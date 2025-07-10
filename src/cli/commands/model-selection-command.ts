import { RequestyAPI } from '../../core/api';
import { ModelInfo } from '../../core/types';
import { TerminalUI } from '../../ui/terminal-ui';
import { ErrorHandler } from '../../utils/error-handler';
import { InputValidator } from '../../utils/input-validator';
import { BaseCommand } from './base-command';

/**
 * Model selection command for interactive model testing
 * Provides detailed model selection with categories and filtering
 */
export class ModelSelectionCommand extends BaseCommand {
  private api: RequestyAPI;
  private ui: TerminalUI;

  constructor(api: RequestyAPI, ui: TerminalUI) {
    super('model-selection', 'Interactive model selection and testing');
    this.api = api;
    this.ui = ui;
  }

  /**
   * Execute the model selection command
   * @param args - Command arguments [category?, filter?, interactive?]
   * @returns Promise that resolves when command completes
   */
  protected async run(args: any[]): Promise<any> {
    try {
      // Parse arguments
      const { category, filter, interactive } = this.parseArgs(args);

      // Get available models
      const availableModels = await this.getAvailableModels(category, filter);

      // Display model selection interface
      await this.displayModelSelection(availableModels);

      // Get user selection
      const selectedModels = await this.getModelSelection(
        availableModels,
        interactive
      );

      // Get prompt from user
      const prompt = await this.ui.getPrompt();
      const validatedPrompt = InputValidator.validatePrompt(prompt);

      // Get streaming preference
      const streaming = await this.ui.getStreamingPreference();

      // Test selected models
      const results = await this.testSelectedModels(
        selectedModels,
        validatedPrompt,
        streaming
      );

      // Display results
      await this.displayResults(results);

      return this.createResult(
        true,
        results,
        'Model selection completed successfully'
      );
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Model selection command');
    }
  }

  /**
   * Parse command arguments
   * @param args - Raw command arguments
   * @returns Parsed and validated arguments
   */
  private parseArgs(args: any[]): ModelSelectionArgs {
    const [category, filter, interactive] = args;

    return {
      category: category ? this.validateString(category, 'category') : null,
      filter: filter ? this.validateString(filter, 'filter') : null,
      interactive: interactive !== 'false' && interactive !== false,
    };
  }

  /**
   * Get available models based on category and filter
   * @param category - Model category filter
   * @param filter - Text filter for model names
   * @returns Array of available models
   */
  private async getAvailableModels(
    category: string | null,
    filter: string | null
  ): Promise<ModelInfo[]> {
    let models = this.api.getAvailableModels();

    // Filter by category
    if (category) {
      models = models.filter((model) =>
        model.provider.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Filter by text
    if (filter) {
      const filterLower = filter.toLowerCase();
      models = models.filter(
        (model) =>
          model.name.toLowerCase().includes(filterLower) ||
          model.provider.toLowerCase().includes(filterLower)
      );
    }

    return models;
  }

  /**
   * Display model selection interface
   * @param models - Available models to display
   */
  private async displayModelSelection(models: ModelInfo[]): Promise<void> {
    this.ui.displayHeader('🎯 Model Selection');

    // Group models by provider
    const groupedModels = this.groupModelsByProvider(models);

    // Display each provider group
    for (const [provider, providerModels] of Object.entries(groupedModels)) {
      this.ui.displayInfo(`\n📦 ${provider} Models:`);

      const tableData = providerModels.map((model, index) => ({
        '#': index + 1,
        Model: model.name,
        Context: model.contextWindow
          ? `${model.contextWindow.toLocaleString()} tokens`
          : 'N/A',
        Price: model.pricing
          ? `$${model.pricing.input}/M in, $${model.pricing.output}/M out`
          : 'N/A',
        Features: this.getModelFeatures(model),
      }));

      this.ui.displayTable(tableData);
    }

    this.ui.displayInfo(`\n📊 Total models available: ${models.length}`);
  }

  /**
   * Group models by provider
   * @param models - Models to group
   * @returns Grouped models
   */
  private groupModelsByProvider(
    models: ModelInfo[]
  ): Record<string, ModelInfo[]> {
    return models.reduce(
      (groups, model) => {
        const provider = model.provider;
        if (!groups[provider]) {
          groups[provider] = [];
        }
        groups[provider].push(model);
        return groups;
      },
      {} as Record<string, ModelInfo[]>
    );
  }

  /**
   * Get model features as string
   * @param model - Model to get features for
   * @returns Features string
   */
  private getModelFeatures(model: ModelInfo): string {
    const features = [];

    if (model.supportsVision) {
      features.push('Vision');
    }
    if (model.supportsJson) {
      features.push('JSON');
    }
    if (model.supportsStreaming) {
      features.push('Streaming');
    }
    if (model.supportsTools) {
      features.push('Tools');
    }

    return features.join(', ') || 'Basic';
  }

  /**
   * Get model selection from user
   * @param models - Available models
   * @param interactive - Whether to use interactive selection
   * @returns Selected models
   */
  private async getModelSelection(
    models: ModelInfo[],
    interactive: boolean
  ): Promise<ModelInfo[]> {
    if (!interactive) {
      // Return default selection
      return models.slice(0, 5);
    }

    // Interactive selection
    const choices = models.map((model) => ({
      name: `${model.name} (${model.provider})`,
      value: model,
      short: model.name,
    }));

    const selectedModels = await this.ui.selectMultipleModels(choices);

    if (selectedModels.length === 0) {
      throw new Error('No models selected');
    }

    if (selectedModels.length > 10) {
      throw new Error('Too many models selected (maximum 10)');
    }

    return selectedModels;
  }

  /**
   * Test selected models
   * @param models - Models to test
   * @param prompt - Prompt to test with
   * @param streaming - Whether to use streaming
   * @returns Test results
   */
  private async testSelectedModels(
    models: ModelInfo[],
    prompt: string,
    streaming: boolean
  ): Promise<ModelSelectionResult[]> {
    this.ui.displayInfo(`\n🔄 Testing ${models.length} selected models...`);

    // Create progress indicator
    const progressCallback = (completed: number, total: number) => {
      const percentage = Math.round((completed / total) * 100);
      this.ui.displayProgress(`Testing models... ${percentage}%`);
    };

    // Test models with progress tracking
    const results: ModelSelectionResult[] = [];

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      progressCallback(i, models.length);

      try {
        const result = await this.api.testModel(model, prompt, streaming);
        results.push({
          model: model.name,
          provider: model.provider,
          success: true,
          result,
          error: null,
          features: this.getModelFeatures(model),
        });
      } catch (error) {
        results.push({
          model: model.name,
          provider: model.provider,
          success: false,
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          features: this.getModelFeatures(model),
        });
      }
    }

    progressCallback(models.length, models.length);

    return results;
  }

  /**
   * Display test results
   * @param results - Test results to display
   */
  private async displayResults(results: ModelSelectionResult[]): Promise<void> {
    this.ui.displayHeader('📊 Model Selection Results');

    // Sort results by success and response time
    const sortedResults = results.sort((a, b) => {
      if (a.success && !b.success) {
        return -1;
      }
      if (!a.success && b.success) {
        return 1;
      }
      if (a.success && b.success) {
        return (a.result?.duration || 0) - (b.result?.duration || 0);
      }
      return 0;
    });

    // Display results table
    const tableData = sortedResults.map((r) => ({
      Model: r.model,
      Provider: r.provider,
      Status: r.success ? '✅ Success' : '❌ Failed',
      'Response Time': r.success ? `${r.result?.duration || 0}ms` : 'N/A',
      Tokens: r.success ? r.result?.usage?.total_tokens || 0 : 'N/A',
      Cost:
        r.success && r.result?.cost ? `$${r.result.cost.toFixed(4)}` : 'N/A',
      Features: r.features,
    }));

    this.ui.displayTable(tableData);

    // Display summary
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    this.ui.displayInfo(
      `\n📈 Summary: ${successful.length} successful, ${failed.length} failed`
    );

    // Display fastest model
    if (successful.length > 0) {
      const fastest = successful.reduce((prev, curr) =>
        (prev.result?.duration || 0) < (curr.result?.duration || 0)
          ? prev
          : curr
      );
      this.ui.displaySuccess(
        `🏆 Fastest model: ${fastest.model} (${fastest.result?.duration}ms)`
      );
    }

    // Display error details if any
    if (failed.length > 0) {
      this.ui.displayError('\n❌ Failed Tests:');
      failed.forEach((r) => {
        this.ui.displayError(`${r.model}: ${r.error}`);
      });
    }
  }

  /**
   * Display command-specific help
   */
  protected displaySpecificHelp(): void {
    console.log(`
Options:
  [category]     Filter by provider category (openai, anthropic, google, etc.)
  [filter]       Filter by model name or provider text
  [interactive]  Use interactive selection (true/false, default: true)

Examples:
  requesty model-selection
  requesty model-selection openai
  requesty model-selection "" gpt
  requesty model-selection anthropic "" false

Categories: openai, anthropic, google, meta, mistral, cohere
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
 * Model selection arguments interface
 */
interface ModelSelectionArgs {
  category: string | null;
  filter: string | null;
  interactive: boolean;
}

/**
 * Model selection result interface
 */
interface ModelSelectionResult {
  model: string;
  provider: string;
  success: boolean;
  result: any;
  error: string | null;
  features: string;
}
