/**
 * @fileoverview Main chat module exports
 * @author Requesty CLI Team
 * @license MIT
 * @copyright 2024 Requesty CLI Contributors
 */

// Core components
export { ChatClient } from './core/chat-client';

// UI components
export { ChatInterface } from './ui/chat-interface';

// Types
export type {
  ChatMessage,
  ChatSession,
  ChatResponse,
  FeedbackResponse,
  ChatConfig,
  ConversationSummary,
  FeaturedModel,
  ModelCategory,
} from './types/chat-types';

// Configuration
export {
  FEATURED_MODELS,
  MODEL_CATEGORIES,
  getDefaultChatModel,
  getModelById,
  getModelsByProvider,
  getRecommendedModels,
  DEFAULT_SYSTEM_PROMPT,
} from './config/featured-models';
