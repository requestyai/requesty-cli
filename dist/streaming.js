"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingClient = void 0;
const axios_1 = __importDefault(require("axios"));
class StreamingClient {
    constructor(config) {
        this.config = config;
    }
    async streamCompletion(request, onChunk) {
        const startTime = Date.now();
        let fullResponse = '';
        let totalTokens = 0;
        try {
            const response = await axios_1.default.post(`${this.config.baseURL}/chat/completions`, { ...request, stream: true }, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
                    'Accept': 'text/event-stream'
                },
                responseType: 'stream',
                timeout: this.config.timeout
            });
            return new Promise((resolve, reject) => {
                let buffer = '';
                response.data.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                const duration = Date.now() - startTime;
                                const tokensPerSecond = totalTokens / (duration / 1000);
                                resolve({
                                    success: true,
                                    fullResponse,
                                    duration,
                                    tokensPerSecond,
                                    totalTokens
                                });
                                return;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices[0]?.delta?.content;
                                if (content) {
                                    fullResponse += content;
                                    totalTokens += this.estimateTokens(content);
                                    const currentDuration = Date.now() - startTime;
                                    const tokensPerSecond = totalTokens / (currentDuration / 1000);
                                    onChunk(content, { tokensPerSecond, totalTokens });
                                }
                            }
                            catch (e) {
                            }
                        }
                    }
                });
                response.data.on('end', () => {
                    const duration = Date.now() - startTime;
                    const tokensPerSecond = totalTokens / (duration / 1000);
                    resolve({
                        success: true,
                        fullResponse,
                        duration,
                        tokensPerSecond,
                        totalTokens
                    });
                });
                response.data.on('error', (error) => {
                    reject(error);
                });
            });
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