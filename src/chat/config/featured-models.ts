/**
 * @fileoverview Featured models configuration for chat
 * @author Requesty CLI Team
 * @license MIT
 * @copyright 2024 Requesty CLI Contributors
 */

import { FeaturedModel, ModelCategory } from '../types/chat-types';

export const FEATURED_MODELS: FeaturedModel[] = [
  // OpenAI Models
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4 Optimized',
    provider: 'OpenAI',
    description: 'Most capable GPT-4 model, optimized for chat',
    capabilities: ['advanced-reasoning', 'long-context', 'creative-writing', 'coding'],
    recommended: true,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4 Mini',
    provider: 'OpenAI',
    description: 'Smaller, faster, cheaper GPT-4 variant',
    capabilities: ['general-purpose', 'fast-response', 'cost-effective'],
    recommended: false,
  },
  {
    id: 'openai/gpt-4.1-turbo',
    name: 'GPT-4.1 Turbo',
    provider: 'OpenAI',
    description: 'Latest GPT-4 with improved performance',
    capabilities: ['advanced-reasoning', 'vision', 'json-mode', 'function-calling'],
    recommended: true,
  },

  // Anthropic Models
  {
    id: 'anthropic/claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    description: 'Latest Claude model with superior capabilities',
    capabilities: ['advanced-reasoning', 'ultra-long-context', 'creative-writing', 'analysis'],
    recommended: true,
  },
  {
    id: 'anthropic/claude-haiku-4-20250514',
    name: 'Claude Haiku 4',
    provider: 'Anthropic',
    description: 'Fast and efficient Claude model',
    capabilities: ['fast-response', 'cost-effective', 'general-purpose'],
    recommended: false,
  },

  // Google Models
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Ultra-fast multimodal AI model',
    capabilities: ['multimodal', 'fast-response', 'vision', 'long-context'],
    recommended: true,
  },
  {
    id: 'google/gemini-2.0-pro',
    name: 'Gemini 2.0 Pro',
    provider: 'Google',
    description: 'Advanced reasoning with multimodal capabilities',
    capabilities: ['advanced-reasoning', 'multimodal', 'vision', 'analysis'],
    recommended: false,
  },

  // DeepSeek Models
  {
    id: 'nebius/deepseek-ai/DeepSeek-V3-0324-fast',
    name: 'DeepSeek V3 Fast',
    provider: 'DeepSeek',
    description: 'High-performance open model',
    capabilities: ['coding', 'reasoning', 'fast-response', 'multilingual'],
    recommended: false,
  },

  // Mistral Models
  {
    id: 'mistral/mistral-large-latest',
    name: 'Mistral Large',
    provider: 'Mistral',
    description: 'Top-tier Mistral model with strong capabilities',
    capabilities: ['reasoning', 'coding', 'multilingual', 'function-calling'],
    recommended: false,
  },

  // xAI Models
  {
    id: 'xai/grok-2.5-1212',
    name: 'Grok 2.5',
    provider: 'xAI',
    description: 'Advanced model with real-time information',
    capabilities: ['real-time-info', 'reasoning', 'humor', 'analysis'],
    recommended: false,
  },
];

export const MODEL_CATEGORIES: ModelCategory[] = [
  {
    name: 'Recommended',
    description: 'Best models for general chat',
    models: FEATURED_MODELS.filter(m => m.recommended),
  },
  {
    name: 'Fast & Efficient',
    description: 'Quick responses, lower cost',
    models: FEATURED_MODELS.filter(m => 
      m.capabilities.includes('fast-response') || 
      m.capabilities.includes('cost-effective')
    ),
  },
  {
    name: 'Advanced Reasoning',
    description: 'Best for complex tasks',
    models: FEATURED_MODELS.filter(m => 
      m.capabilities.includes('advanced-reasoning')
    ),
  },
  {
    name: 'Creative & Writing',
    description: 'Excellent for creative tasks',
    models: FEATURED_MODELS.filter(m => 
      m.capabilities.includes('creative-writing')
    ),
  },
  {
    name: 'Coding & Technical',
    description: 'Optimized for programming',
    models: FEATURED_MODELS.filter(m => 
      m.capabilities.includes('coding')
    ),
  },
];

export const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. You provide clear, accurate, and helpful responses while being conversational and friendly. If you're unsure about something, you say so honestly.`;

export function getDefaultChatModel(): string {
  return 'openai/gpt-4o';
}

export function getModelById(id: string): FeaturedModel | undefined {
  return FEATURED_MODELS.find(m => m.id === id);
}

export function getModelsByProvider(provider: string): FeaturedModel[] {
  return FEATURED_MODELS.filter(m => m.provider.toLowerCase() === provider.toLowerCase());
}

export function getRecommendedModels(): FeaturedModel[] {
  return FEATURED_MODELS.filter(m => m.recommended);
}