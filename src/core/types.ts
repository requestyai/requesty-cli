export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelResult {
  model: string;
  success: boolean;
  response?: ChatCompletionResponse;
  error?: string;
  duration?: number;
}

export interface CLIConfig {
  apiKey?: string;
  baseURL: string;
  timeout: number;
  maxTokens: number;
  temperature: number;
}