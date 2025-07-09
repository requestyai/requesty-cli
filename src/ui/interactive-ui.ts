import chalk from 'chalk';
import inquirer from 'inquirer';
import figlet from 'figlet';
import gradient from 'gradient-string';
import cliProgress from 'cli-progress';
import { createSpinner } from 'nanospinner';
import Table from 'cli-table3';
import { ModelProvider, categorizeModels, DEFAULT_MODELS, getProviderFromModel } from '../models/models';
import { ModelInfo } from '../core/types';

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
    const spinner = createSpinner('Loading model providers...').start();
    
    this.providers = categorizeModels(models);
    
    // Filter providers with models
    Object.keys(this.providers).forEach(key => {
      if (this.providers[key].models.length === 0) {
        delete this.providers[key];
      }
    });

    spinner.success({ text: `Loaded ${Object.keys(this.providers).length} providers with ${models.length} models` });
    console.log();
  }

  async showMainMenu(): Promise<'quick' | 'select' | 'exit'> {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          {
            name: `🚀 Quick Start (${DEFAULT_MODELS.length} default models)`,
            value: 'quick'
          },
          {
            name: '🎯 Select Models',
            value: 'select'
          },
          {
            name: '❌ Exit',
            value: 'exit'
          }
        ]
      }
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
        choices: Object.values(this.providers).map(provider => ({
          name: `${provider.displayName} (${provider.models.length} models)`,
          value: provider.name,
          checked: DEFAULT_MODELS.some(model => model.startsWith(provider.name))
        }))
      }
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
          choices: provider.models.map(model => ({
            name: model.split('/').slice(1).join('/'),
            value: model,
            checked: DEFAULT_MODELS.includes(model)
          })),
          pageSize: 15
        }
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
            value: true
          },
          {
            name: '📊 Standard responses (complete responses with token counts)',
            value: false
          }
        ]
      }
    ]);

    return useStreaming;
  }

  async getPrompt(): Promise<string> {
    const { prompt } = await inquirer.prompt([
      {
        type: 'input',
        name: 'prompt',
        message: '💬 Enter your prompt:',
        validate: (input: string) => input.trim().length > 0 || 'Prompt cannot be empty'
      }
    ]);

    return prompt;
  }

  showSelectedModels(models: string[]) {
    console.log();
    console.log(chalk.green('✅ Selected Models:'));
    
    const table = new Table({
      head: ['#', 'Provider', 'Model'],
      style: { head: ['cyan'] }
    });

    models.forEach((model, index) => {
      const provider = getProviderFromModel(model);
      const modelName = model.split('/').slice(1).join('/');
      const providerInfo = this.providers[provider];
      
      table.push([
        (index + 1).toString(),
        providerInfo ? providerInfo.displayName : provider,
        modelName
      ]);
    });

    console.log(table.toString());
    console.log();
  }

  createStreamingProgress(modelName: string): {
    progress: cliProgress.SingleBar;
    updateProgress: (content: string, stats: { tokensPerSecond: number; totalTokens: number }) => void;
    finish: (success: boolean, error?: string) => void;
  } {
    // Use dynamic max value based on expected tokens, with minimum of 50
    const maxTokens = Math.max(200, 50);
    
    const progress = new cliProgress.SingleBar({
      format: `${chalk.blue(modelName.padEnd(25))} |{bar}| {percentage}% | {speed} tok/s | {tokens} tokens | {duration}ms`,
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      clearOnComplete: false,
      stopOnComplete: false,
      barsize: 30
    }, cliProgress.Presets.shades_classic);

    const startTime = Date.now();
    progress.start(maxTokens, 0, {
      speed: '0',
      tokens: '0',
      duration: '0'
    });

    const updateProgress = (content: string, stats: { tokensPerSecond: number; totalTokens: number }) => {
      const currentDuration = Date.now() - startTime;
      const progressValue = Math.min(stats.totalTokens, maxTokens);
      const percentage = ((stats.totalTokens / maxTokens) * 100).toFixed(0);
      
      progress.update(progressValue, {
        speed: stats.tokensPerSecond.toFixed(0),
        tokens: stats.totalTokens.toString(),
        duration: currentDuration.toString(),
        percentage: percentage
      });
    };

    const finish = (success: boolean, error?: string) => {
      const finalDuration = Date.now() - startTime;
      
      if (success) {
        progress.update(maxTokens, {
          speed: 'Done',
          tokens: 'Complete',
          duration: finalDuration.toString(),
          percentage: '100'
        });
        progress.stop();
        console.log(chalk.green(`✅ ${modelName} completed in ${finalDuration}ms`));
      } else {
        progress.stop();
        console.log(chalk.red(`❌ ${modelName} failed: ${error}`));
      }
    };

    return { progress, updateProgress, finish };
  }

  showStreamingResponse(modelName: string, response: string) {
    console.log();
    console.log(chalk.blue(`📝 ${modelName} Response:`));
    console.log(chalk.dim('─'.repeat(60)));
    console.log(response);
    console.log(chalk.dim('─'.repeat(60)));
    console.log();
  }

  showSummary(results: Array<{ model: string; success: boolean; duration: number; tokensPerSecond: number; totalTokens: number; error?: string }>) {
    console.log();
    console.log(chalk.green('📊 Summary:'));
    
    const table = new Table({
      head: ['Model', 'Status', 'Duration', 'Speed', 'Tokens'],
      style: { head: ['cyan'] }
    });

    results.forEach(result => {
      table.push([
        result.model,
        result.success ? chalk.green('✅') : chalk.red('❌'),
        `${result.duration}ms`,
        `${result.tokensPerSecond.toFixed(0)} tok/s`,
        result.totalTokens.toString()
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
        default: true
      }
    ]);

    return cont;
  }

  async askShowResponses(): Promise<boolean> {
    const { showResponses } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'showResponses',
        message: 'Would you like to see all the response content?',
        default: false
      }
    ]);

    return showResponses;
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