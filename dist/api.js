"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestyAPI = void 0;
const openai_1 = __importDefault(require("openai"));
class RequestyAPI {
    constructor(config) {
        this.config = config;
        this.openai = new openai_1.default({
            baseURL: config.baseURL,
            apiKey: config.apiKey || '<REQUESTY_API_KEY>',
            timeout: config.timeout,
            defaultHeaders: {
                'HTTP-Referer': 'https://github.com/requestyai/requesty-cli',
                'X-Title': 'requesty-cli',
            },
        });
    }
    async getModels() {
        try {
            const response = await this.openai.models.list();
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async sendChatCompletion(request) {
        try {
            const response = await this.openai.chat.completions.create({
                model: request.model,
                messages: request.messages,
                max_tokens: request.max_tokens,
                temperature: request.temperature,
                stream: request.stream || false,
            });
            return response;
        }
        catch (error) {
            if (error instanceof openai_1.default.APIError) {
                throw new Error(`API Error: ${error.message}`);
            }
            throw new Error(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async testModel(model, prompt) {
        const startTime = Date.now();
        try {
            const request = {
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
                stream: false
            };
            const response = await this.sendChatCompletion(request);
            const duration = Date.now() - startTime;
            return {
                success: true,
                response,
                duration
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration
            };
        }
    }
}
exports.RequestyAPI = RequestyAPI;
//# sourceMappingURL=api.js.map