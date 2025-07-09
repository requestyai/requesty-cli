"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractiveUI = void 0;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const figlet_1 = __importDefault(require("figlet"));
const gradient_string_1 = __importDefault(require("gradient-string"));
const cli_progress_1 = __importDefault(require("cli-progress"));
const nanospinner_1 = require("nanospinner");
const cli_table3_1 = __importDefault(require("cli-table3"));
const models_1 = require("./models");
class InteractiveUI {
    constructor() {
        this.providers = {};
        this.selectedModels = [];
        this.showWelcome();
    }
    showWelcome() {
        console.clear();
        console.log(gradient_string_1.default.rainbow(figlet_1.default.textSync('Requesty', { font: 'Big' })));
        console.log(chalk_1.default.cyan('🚀 AI Model Testing CLI with Streaming'));
        console.log(chalk_1.default.dim('━'.repeat(60)));
        console.log();
    }
    async initializeModels(models) {
        const spinner = (0, nanospinner_1.createSpinner)('Loading model providers...').start();
        this.providers = (0, models_1.categorizeModels)(models);
        Object.keys(this.providers).forEach(key => {
            if (this.providers[key].models.length === 0) {
                delete this.providers[key];
            }
        });
        spinner.success({ text: `Loaded ${Object.keys(this.providers).length} providers with ${models.length} models` });
        console.log();
    }
    async showMainMenu() {
        const { action } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    {
                        name: `🚀 Quick Start (${models_1.DEFAULT_MODELS.length} default models)`,
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
    async selectModels() {
        console.log(chalk_1.default.yellow('📋 Select Models by Provider'));
        console.log();
        const { selectedProviders } = await inquirer_1.default.prompt([
            {
                type: 'checkbox',
                name: 'selectedProviders',
                message: 'Select providers:',
                choices: Object.values(this.providers).map(provider => ({
                    name: `${provider.displayName} (${provider.models.length} models)`,
                    value: provider.name,
                    checked: models_1.DEFAULT_MODELS.some(model => model.startsWith(provider.name))
                }))
            }
        ]);
        if (selectedProviders.length === 0) {
            console.log(chalk_1.default.red('No providers selected, using defaults'));
            return models_1.DEFAULT_MODELS;
        }
        const selectedModels = [];
        for (const providerName of selectedProviders) {
            const provider = this.providers[providerName];
            const { models } = await inquirer_1.default.prompt([
                {
                    type: 'checkbox',
                    name: 'models',
                    message: `Select models from ${provider.displayName}:`,
                    choices: provider.models.map(model => ({
                        name: model.split('/').slice(1).join('/'),
                        value: model,
                        checked: models_1.DEFAULT_MODELS.includes(model)
                    })),
                    pageSize: 15
                }
            ]);
            selectedModels.push(...models);
        }
        return selectedModels.length > 0 ? selectedModels : models_1.DEFAULT_MODELS;
    }
    async getStreamingChoice() {
        const { useStreaming } = await inquirer_1.default.prompt([
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
    async getPrompt() {
        const { prompt } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'prompt',
                message: '💬 Enter your prompt:',
                validate: (input) => input.trim().length > 0 || 'Prompt cannot be empty'
            }
        ]);
        return prompt;
    }
    showSelectedModels(models) {
        console.log();
        console.log(chalk_1.default.green('✅ Selected Models:'));
        const table = new cli_table3_1.default({
            head: ['#', 'Provider', 'Model'],
            style: { head: ['cyan'] }
        });
        models.forEach((model, index) => {
            const provider = (0, models_1.getProviderFromModel)(model);
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
    createStreamingProgress(modelName) {
        const maxTokens = Math.max(200, 50);
        const progress = new cli_progress_1.default.SingleBar({
            format: `${chalk_1.default.blue(modelName.padEnd(25))} |{bar}| {percentage}% | {speed} tok/s | {tokens} tokens | {duration}ms`,
            barCompleteChar: '█',
            barIncompleteChar: '░',
            hideCursor: true,
            clearOnComplete: false,
            stopOnComplete: false,
            barsize: 30
        }, cli_progress_1.default.Presets.shades_classic);
        const startTime = Date.now();
        progress.start(maxTokens, 0, {
            speed: '0',
            tokens: '0',
            duration: '0'
        });
        const updateProgress = (content, stats) => {
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
        const finish = (success, error) => {
            const finalDuration = Date.now() - startTime;
            if (success) {
                progress.update(maxTokens, {
                    speed: 'Done',
                    tokens: 'Complete',
                    duration: finalDuration.toString(),
                    percentage: '100'
                });
                progress.stop();
                console.log(chalk_1.default.green(`✅ ${modelName} completed in ${finalDuration}ms`));
            }
            else {
                progress.stop();
                console.log(chalk_1.default.red(`❌ ${modelName} failed: ${error}`));
            }
        };
        return { progress, updateProgress, finish };
    }
    showStreamingResponse(modelName, response) {
        console.log();
        console.log(chalk_1.default.blue(`📝 ${modelName} Response:`));
        console.log(chalk_1.default.dim('─'.repeat(60)));
        console.log(response);
        console.log(chalk_1.default.dim('─'.repeat(60)));
        console.log();
    }
    showSummary(results) {
        console.log();
        console.log(chalk_1.default.green('📊 Summary:'));
        const table = new cli_table3_1.default({
            head: ['Model', 'Status', 'Duration', 'Speed', 'Tokens'],
            style: { head: ['cyan'] }
        });
        results.forEach(result => {
            table.push([
                result.model,
                result.success ? chalk_1.default.green('✅') : chalk_1.default.red('❌'),
                `${result.duration}ms`,
                `${result.tokensPerSecond.toFixed(0)} tok/s`,
                result.totalTokens.toString()
            ]);
        });
        console.log(table.toString());
        console.log();
    }
    async askContinue() {
        const { continue: cont } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'continue',
                message: 'Would you like to test another prompt?',
                default: true
            }
        ]);
        return cont;
    }
    showError(error) {
        console.log(chalk_1.default.red(`❌ Error: ${error}`));
        console.log();
    }
    showGoodbye() {
        console.log();
        console.log(gradient_string_1.default.rainbow('Thanks for using Requesty CLI! 🚀'));
        console.log();
    }
}
exports.InteractiveUI = InteractiveUI;
//# sourceMappingURL=interactive-ui.js.map