import { ModelInfo, ChatCompletionRequest, ChatCompletionResponse, CLIConfig } from './types';
export declare class RequestyAPI {
    private config;
    private axiosInstance;
    constructor(config: CLIConfig);
    getModels(): Promise<ModelInfo[]>;
    sendChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    testModel(model: string, prompt: string): Promise<{
        success: boolean;
        response?: ChatCompletionResponse;
        error?: string;
        duration: number;
    }>;
}
//# sourceMappingURL=api.d.ts.map