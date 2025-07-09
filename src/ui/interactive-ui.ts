import chalk from 'chalk';
import Table from 'cli-table3';
import figlet from 'figlet';
import gradient from 'gradient-string';
import inquirer from 'inquirer';
import ora from 'ora';
import { ModelInfo } from '../core/types';
import {
  categorizeModels,
  DEFAULT_MODELS,
  getProviderFromModel,
  ModelProvider,
} from '../models/models';
import { FileValidator } from '../utils/file-validator';

export class InteractiveUI {
  private providers: Record<string, ModelProvider> = {};
  private selectedModels: string[] = [];

  constructor() {
    this.showWelcome();
  }

  private showWelcome() {
    console.clear();
    console.log(gradient.rainbow(figlet.textSync('Requesty', { font: 'Big' })));
    console.log(chalk.cyan('🚀 AI Model Testing CLI with Streaming'));
    console.log(chalk.dim('━'.repeat(60)));
    console.log();
  }

  async initializeModels(models: ModelInfo[]): Promise<void> {
    const spinner = ora('Loading model providers...').start();

    this.providers = categorizeModels(models);

    // Filter providers with models
    Object.keys(this.providers).forEach((key) => {
      if (this.providers[key].models.length === 0) {
        delete this.providers[key];
      }
    });

    spinner.succeed(
      `Loaded ${Object.keys(this.providers).length} providers with ${models.length} models`
    );
    console.log();
  }

  async showMainMenu(): Promise<
    'quick' | 'select' | 'pdf-chat' | 'security' | 'exit'
  > {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          {
            name: `🚀 Quick Start (${DEFAULT_MODELS.length} default models)`,
            value: 'quick',
          },
          {
            name: '🎯 Select Models',
            value: 'select',
          },
          {
            name: '📄 Chat with PDF',
            value: 'pdf-chat',
          },
          {
            name: '🔒 Security Status',
            value: 'security',
          },
          {
            name: '❌ Exit',
            value: 'exit',
          },
        ],
      },
    ]);

    return action;
  }

  async selectModels(): Promise<string[]> {
    console.log(chalk.yellow('📋 Select Models by Provider'));
    console.log();

    const { selectedProviders } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedProviders',
        message: 'Select providers:',
        choices: Object.values(this.providers).map((provider) => ({
          name: `${provider.displayName} (${provider.models.length} models)`,
          value: provider.name,
          checked: DEFAULT_MODELS.some((model) =>
            model.startsWith(provider.name)
          ),
        })),
      },
    ]);

    if (selectedProviders.length === 0) {
      console.log(chalk.red('No providers selected, using defaults'));
      return DEFAULT_MODELS;
    }

    const selectedModels: string[] = [];

    for (const providerName of selectedProviders) {
      const provider = this.providers[providerName];
      const { models } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'models',
          message: `Select models from ${provider.displayName}:`,
          choices: provider.models.map((model) => ({
            name: model.split('/').slice(1).join('/'),
            value: model,
            checked: DEFAULT_MODELS.includes(model),
          })),
          pageSize: 15,
        },
      ]);

      selectedModels.push(...models);
    }

    return selectedModels.length > 0 ? selectedModels : DEFAULT_MODELS;
  }

  async getStreamingChoice(): Promise<boolean> {
    const { useStreaming } = await inquirer.prompt([
      {
        type: 'list',
        name: 'useStreaming',
        message: '⚡ Choose response mode:',
        choices: [
          {
            name: '📡 Stream responses (real-time, live output)',
            value: true,
          },
          {
            name: '📊 Standard responses (complete responses with token counts)',
            value: false,
          },
        ],
      },
    ]);

    return useStreaming;
  }

  async getPrompt(): Promise<string> {
    const { prompt } = await inquirer.prompt([
      {
        type: 'input',
        name: 'prompt',
        message: '💬 Enter your prompt:',
        validate: (input: string) =>
          input.trim().length > 0 || 'Prompt cannot be empty',
      },
    ]);

    return prompt;
  }

  async getComparisonPrompts(): Promise<{ prompt1: string; prompt2: string }> {
    console.log(
      chalk.yellow('\n📝 Enter two prompts to compare performance:\n')
    );

    const { prompt1 } = await inquirer.prompt([
      {
        type: 'input',
        name: 'prompt1',
        message: '💬 Prompt 1 (Baseline):',
        validate: (input: string) =>
          input.trim().length > 0 || 'Prompt 1 cannot be empty',
      },
    ]);

    const { prompt2 } = await inquirer.prompt([
      {
        type: 'input',
        name: 'prompt2',
        message: '💬 Prompt 2 (Comparison):',
        validate: (input: string) =>
          input.trim().length > 0 || 'Prompt 2 cannot be empty',
      },
    ]);

    return { prompt1, prompt2 };
  }

  async getPDFPath(): Promise<string> {
    const { pdfPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'pdfPath',
        message: '📄 Enter the path to your PDF file:',
        validate: (input: string) => {
          const validation = FileValidator.validatePDF(input.trim());
          return validation.valid ? true : validation.error!;
        },
      },
    ]);

    return pdfPath;
  }

  async getPDFModel(): Promise<string> {
    const { model } = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: '🤖 Select AI model for PDF chat:',
        choices: [
          {
            name: 'GPT-4.1 (OpenAI) - Recommended for PDF',
            value: 'openai/gpt-4.1',
          },
          {
            name: 'Claude Sonnet 4 (Anthropic) - Great for analysis',
            value: 'anthropic/claude-sonnet-4-20250514',
          },
          {
            name: 'Gemini 2.5 Flash (Google) - Fast and efficient',
            value: 'google/gemini-2.5-flash',
          },
          {
            name: 'Mistral Large (Mistral) - Cost effective',
            value: 'mistral/mistral-large-latest',
          },
          {
            name: 'GPT-4o Mini (OpenAI) - Budget friendly',
            value: 'openai/gpt-4o-mini',
          },
        ],
      },
    ]);

    return model;
  }

  showSelectedModels(models: string[]) {
    console.log();
    console.log(chalk.green('✅ Selected Models:'));

    const table = new Table({
      head: ['#', 'Provider', 'Model'],
      style: { head: ['cyan'] },
    });

    models.forEach((model, index) => {
      const provider = getProviderFromModel(model);
      const modelName = model.split('/').slice(1).join('/');
      const providerInfo = this.providers[provider];

      table.push([
        (index + 1).toString(),
        providerInfo ? providerInfo.displayName : provider,
        modelName,
      ]);
    });

    console.log(table.toString());
    console.log();
  }

  createStreamingProgress(modelName: string): {
    spinner: any;
    updateProgress: (
      content: string,
      stats: { tokensPerSecond: number; totalTokens: number }
    ) => void;
    finish: (success: boolean, error?: string) => void;
  } {
    const spinner = ora({
      text: `${chalk.blue(modelName.padEnd(25))} Starting...`,
      spinner: 'dots',
    }).start();

    const startTime = Date.now();
    let lastUpdateTime = startTime;

    const updateProgress = (
      content: string,
      stats: { tokensPerSecond: number; totalTokens: number }
    ) => {
      const currentTime = Date.now();
      const currentDuration = currentTime - startTime;

      // Update every 100ms to avoid overwhelming the terminal
      if (currentTime - lastUpdateTime >= 100) {
        spinner.text = `${chalk.blue(modelName.padEnd(25))} ${stats.tokensPerSecond.toFixed(0)} tok/s | ${stats.totalTokens} tokens | ${currentDuration}ms`;
        lastUpdateTime = currentTime;
      }
    };

    const finish = (success: boolean, error?: string) => {
      const finalDuration = Date.now() - startTime;

      if (success) {
        spinner.succeed(
          `${chalk.green(modelName.padEnd(25))} completed in ${finalDuration}ms`
        );
      } else {
        spinner.fail(`${chalk.red(modelName.padEnd(25))} failed: ${error}`);
      }
    };

    return { spinner, updateProgress, finish };
  }

  showStreamingResponse(modelName: string, response: string) {
    console.log();
    console.log(chalk.blue(`📝 ${modelName} Response:`));
    console.log(chalk.dim('─'.repeat(60)));
    console.log(response);
    console.log(chalk.dim('─'.repeat(60)));
    console.log();
  }

  showSummary(
    results: Array<{
      model: string;
      success: boolean;
      duration: number;
      tokensPerSecond: number;
      totalTokens: number;
      error?: string;
    }>
  ) {
    console.log();
    console.log(chalk.green('📊 Summary:'));

    const table = new Table({
      head: ['Model', 'Status', 'Duration', 'Speed', 'Tokens'],
      style: { head: ['cyan'] },
    });

    results.forEach((result) => {
      table.push([
        result.model,
        result.success ? chalk.green('✅') : chalk.red('❌'),
        `${result.duration}ms`,
        `${result.tokensPerSecond.toFixed(0)} tok/s`,
        result.totalTokens.toString(),
      ]);
    });

    console.log(table.toString());
    console.log();
  }

  async askContinue(): Promise<boolean> {
    const { continue: cont } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Would you like to test another prompt?',
        default: true,
      },
    ]);

    return cont;
  }

  async askShowResponses(): Promise<boolean> {
    const { showResponses } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'showResponses',
        message: 'Would you like to see all the response content?',
        default: false,
      },
    ]);

    return showResponses;
  }

  async askShowRawDebug(): Promise<boolean> {
    const { showDebug } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'showDebug',
        message:
          'Would you like to see raw response debug data (for troubleshooting models with no response)?',
        default: false,
      },
    ]);

    return showDebug;
  }

  showError(error: string) {
    console.log(chalk.red(`❌ Error: ${error}`));
    console.log();
  }

  showGoodbye() {
    console.log();
    console.log(gradient.rainbow('Thanks for using Requesty CLI! 🚀'));
    console.log();
  }
}
