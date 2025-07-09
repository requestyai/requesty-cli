"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingClient = void 0;
const openai_1 = __importDefault(require("openai"));
class StreamingClient {
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
    async streamCompletion(request, onChunk) {
        const startTime = Date.now();
        let fullResponse = '';
        let totalTokens = 0;
        try {
            const stream = await this.openai.chat.completions.create({
                model: request.model,
                messages: request.messages,
                max_tokens: request.max_tokens,
                temperature: request.temperature,
                stream: true,
            });
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    fullResponse += content;
                    totalTokens += this.estimateTokens(content);
                    const currentDuration = Date.now() - startTime;
                    const tokensPerSecond = totalTokens / (currentDuration / 1000);
                    onChunk(content, { tokensPerSecond, totalTokens });
                }
            }
            const duration = Date.now() - startTime;
            const tokensPerSecond = totalTokens / (duration / 1000);
            return {
                success: true,
                fullResponse,
                duration,
                tokensPerSecond,
                totalTokens
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                success: false,
                fullResponse: '',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
                tokensPerSecond: 0,
                totalTokens: 0
            };
        }
    }
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
}
exports.StreamingClient = StreamingClient;
//# sourceMappingURL=streaming.js.map