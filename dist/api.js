"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestyAPI = void 0;
const axios_1 = __importDefault(require("axios"));
class RequestyAPI {
    constructor(config) {
        this.config = config;
        this.axiosInstance = axios_1.default.create({
            baseURL: config.baseURL,
            timeout: config.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
            }
        });
    }
    async getModels() {
        try {
            const response = await this.axiosInstance.get('/models');
            return response.data.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async sendChatCompletion(request) {
        try {
            const response = await this.axiosInstance.post('/chat/completions', request);
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const errorMessage = error.response?.data?.error?.message || error.message;
                throw new Error(`API Error: ${errorMessage}`);
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