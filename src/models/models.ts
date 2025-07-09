import { ModelInfo } from '../core/types';

export interface ModelProvider {
  name: string;
  displayName: string;
  color: string;
  models: string[];
}

export const DEFAULT_MODELS = [
  'openai/gpt-4.1',
  'anthropic/claude-sonnet-4-20250514',
  'google/gemini-2.5-flash',
  'nebius/deepseek-ai/DeepSeek-V3-0324-fast',
  'mistral/mistral-large-latest'
];

export const MODEL_PROVIDERS: Record<string, ModelProvider> = {
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    color: '#10A37F',
    models: []
  },
  anthropic: {
    name: 'anthropic',
    displayName: 'Anthropic',
    color: '#D4860B',
    models: []
  },
  google: {
    name: 'google',
    displayName: 'Google',
    color: '#4285F4',
    models: []
  },
  alibaba: {
    name: 'alibaba',
    displayName: 'Alibaba',
    color: '#FF6A00',
    models: []
  },
  xai: {
    name: 'xai',
    displayName: 'xAI',
    color: '#000000',
    models: []
  },
  mistral: {
    name: 'mistral',
    displayName: 'Mistral',
    color: '#FF7000',
    models: []
  },
  deepseek: {
    name: 'deepseek',
    displayName: 'DeepSeek',
    color: '#1E3A8A',
    models: []
  },
  together: {
    name: 'together',
    displayName: 'Together AI',
    color: '#8B5CF6',
    models: []
  },
  groq: {
    name: 'groq',
    displayName: 'Groq',
    color: '#F97316',
    models: []
  },
  perplexity: {
    name: 'perplexity',
    displayName: 'Perplexity',
    color: '#20B2AA',
    models: []
  }
};

export function categorizeModels(models: ModelInfo[]): Record<string, ModelProvider> {
  const providers = JSON.parse(JSON.stringify(MODEL_PROVIDERS));

  models.forEach(model => {
    const modelId = model.id || model.name || '';
    const provider = modelId.split('/')[0];
    if (providers[provider]) {
      providers[provider].models.push(modelId);
    }
  });

  return providers;
}

export function getProviderFromModel(modelId: string): string {
  return modelId.split('/')[0];
}

export function getModelName(modelId: string): string {
  return modelId.split('/').slice(1).join('/');
}
