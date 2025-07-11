/**
 * @fileoverview Types for general chat functionality
 * @author Requesty CLI Team
 * @license MIT
 * @copyright 2024 Requesty CLI Contributors
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: 'system' | 'user_message' | 'assistant_response';
    messageLength?: number;
    tokensUsed?: number;
  };
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  model: string;
  created: Date;
  lastActivity: Date;
  status: 'initializing' | 'ready' | 'processing' | 'completed' | 'error';
  totalTokens: number;
  totalMessages: number;
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
  tokensUsed?: number;
  responseTime?: number;
  requestId?: string; // For Requesty feedback system
}

export interface FeedbackResponse {
  success: boolean;
  error?: string;
}

export interface ChatConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
  includeSystemPrompt: boolean;
  conversationHistory: boolean;
  systemPrompt?: string;
}

export interface ConversationSummary {
  totalMessages: number;
  userMessages: number;
  assistantResponses: number;
  totalCharacters: number;
  totalTokens: number;
  sessionDuration: number; // in milliseconds
  model: string;
}

// Featured models configuration
export interface FeaturedModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  recommended: boolean;
}

export interface ModelCategory {
  name: string;
  description: string;
  models: FeaturedModel[];
}