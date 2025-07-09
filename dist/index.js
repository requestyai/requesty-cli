#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const commander_1 = require("commander");
const api_1 = require("./api");
const interactive_ui_1 = require("./interactive-ui");
const streaming_1 = require("./streaming");
const dynamic_table_1 = require("./dynamic-table");
const models_1 = require("./models");
const DEFAULT_CONFIG = {
    baseURL: 'https://router.requesty.ai/v1',
    timeout: 60000,
    maxTokens: 500,
    temperature: 0.7
};
class RequestyCLI {
    constructor(config) {
        this.config = config;
        this.api = new api_1.RequestyAPI(config);
        this.streaming = new streaming_1.StreamingClient(config);
        this.ui = new interactive_ui_1.InteractiveUI();
    }
    async run() {
        try {
            const models = await this.api.getModels();
            await this.ui.initializeModels(models);
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
                    case 'exit':
                        running = false;
                        break;
                }
                if (running) {
                    const continueSession = await this.ui.askContinue();
                    if (!continueSession) {
                        running = false;
                    }
                }
            }
            this.ui.showGoodbye();
        }
        catch (error) {
            this.ui.showError(error instanceof Error ? error.message : 'An unexpected error occurred');
        }
    }
    async runQuickStart() {
        const useStreaming = await this.ui.getStreamingChoice();
        const prompt = await this.ui.getPrompt();
        await this.testModels(models_1.DEFAULT_MODELS, prompt, useStreaming);
    }
    async runCustomSelection() {
        const selectedModels = await this.ui.selectModels();
        const useStreaming = await this.ui.getStreamingChoice();
        const prompt = await this.ui.getPrompt();
        await this.testModels(selectedModels, prompt, useStreaming);
    }
    async testModels(models, prompt, useStreaming) {
        this.ui.showSelectedModels(models);
        const modeText = useStreaming ? 'streaming' : 'standard';
        console.log(`🚀 Testing ${models.length} models concurrently with ${modeText} responses...`);
        console.log();
        const resultsTable = new dynamic_table_1.DynamicResultsTable(models, useStreaming);
        if (useStreaming) {
            await this.runStreamingTests(models, prompt, resultsTable);
        }
        else {
            await this.runStandardTests(models, prompt, resultsTable);
        }
        resultsTable.showCompletedResponses();
        resultsTable.showFinalSummary();
    }
    async runStreamingTests(models, prompt, resultsTable) {
        const concurrentPromises = models.map(async (model) => {
            resultsTable.updateModel(model, { status: 'running' });
            const request = {
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: this.config.maxTokens,
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
                }
                else {
                    resultsTable.updateModel(model, {
                        status: 'failed',
                        duration: result.duration,
                        error: result.error
                    });
                }
            }
            catch (error) {
                resultsTable.updateModel(model, {
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        await Promise.all(concurrentPromises);
    }
    async runStandardTests(models, prompt, resultsTable) {
        const concurrentPromises = models.map(async (model) => {
            resultsTable.updateModel(model, { status: 'running' });
            try {
                const result = await this.api.testModel(model, prompt);
                if (result.success && result.response) {
                    const usage = result.response.usage;
                    resultsTable.updateModel(model, {
                        status: 'completed',
                        duration: result.duration,
                        inputTokens: usage?.prompt_tokens || 0,
                        outputTokens: usage?.completion_tokens || 0,
                        totalTokens: usage?.total_tokens || 0,
                        response: result.response.choices[0]?.message?.content || 'No response'
                    });
                }
                else {
                    resultsTable.updateModel(model, {
                        status: 'failed',
                        duration: result.duration,
                        error: result.error
                    });
                }
            }
            catch (error) {
                resultsTable.updateModel(model, {
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        await Promise.all(concurrentPromises);
    }
}
async function main() {
    const program = new commander_1.Command();
    program
        .name('requesty')
        .description('Interactive AI Model Testing CLI with Streaming')
        .version('2.0.0');
    program
        .option('-k, --api-key <key>', 'API key for authentication')
        .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '60000')
        .option('-m, --max-tokens <tokens>', 'Maximum tokens per response', '500')
        .option('--temperature <temp>', 'Temperature for responses', '0.7')
        .action(async (options) => {
        const config = {
            ...DEFAULT_CONFIG,
            apiKey: options.apiKey || process.env.REQUESTY_API_KEY,
            timeout: parseInt(options.timeout),
            maxTokens: parseInt(options.maxTokens),
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
//# sourceMappingURL=index.js.map