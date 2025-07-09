export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  input_price?: number; // Price per token for input
  caching_price?: number; // Price per token for caching
  cached_price?: number; // Price per token for cached input
  output_price?: number; // Price per token for output
  max_output_tokens?: number;
  context_window?: number;
  supports_caching?: boolean;
  supports_vision?: boolean;
  supports_computer_use?: boolean;
  supports_reasoning?: boolean;
  description?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
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
  success?: boolean;
  response?: ChatCompletionResponse | string;
  rawResponse?: any; // The actual raw JSON response from the API
  error?: string;
  duration?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
  tokensPerSecond?: number;
  actualCost?: number; // Actual cost of the request in dollars
  blendedCostPerMillion?: number; // Blended cost per million tokens
  modelInfo?: ModelInfo; // Model pricing info
}

export interface CLIConfig {
  apiKey?: string;
  baseURL: string;
  timeout: number;
  temperature: number;
}