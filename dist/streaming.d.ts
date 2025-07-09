import { CLIConfig, ChatCompletionRequest } from './types';
export interface StreamingResult {
    success: boolean;
    fullResponse: string;
    error?: string;
    duration: number;
    tokensPerSecond: number;
    totalTokens: number;
}
export declare class StreamingClient {
    private config;
    private openai;
    constructor(config: CLIConfig);
    streamCompletion(request: ChatCompletionRequest, onChunk: (chunk: string, stats: {
        tokensPerSecond: number;
        totalTokens: number;
    }) => void): Promise<StreamingResult>;
    private estimateTokens;
}
//# sourceMappingURL=streaming.d.ts.map