export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  
  // Pricing information
  input_price?: number;
  caching_price?: number;
  cached_price?: number;
  output_price?: number;
  
  // Model capabilities
  max_output_tokens?: number;
  context_window?: number;
  supports_caching?: boolean;
  supports_vision?: boolean;
  supports_computer_use?: boolean;
  supports_reasoning?: boolean;
  
  // Additional metadata
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
  rawResponse?: any;
  error?: string;
  duration?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  
  // Token metrics
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
  tokensPerSecond?: number;
  
  // Cost metrics
  actualCost?: number;
  blendedCostPerMillion?: number;
  modelInfo?: ModelInfo;
}

export interface CLIConfig {
  apiKey?: string;
  baseURL: string;
  timeout: number;
  temperature: number;
}