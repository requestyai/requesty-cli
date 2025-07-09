/**
 * Agent Builder Types
 * 
 * Defines the structure for custom AI agents and workflows
 */

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  created: Date;
  updated: Date;
  author: string;
  tags: string[];
  systemPrompt: string;
  steps: AgentStep[];
  variables: AgentVariable[];
  tools: ToolDefinition[];
  settings: AgentSettings;
}

export interface AgentStep {
  id: string;
  name: string;
  type: 'prompt' | 'tool' | 'condition' | 'transform' | 'output';
  order: number;
  enabled: boolean;
  config: StepConfig;
  inputs: StepInput[];
  outputs: StepOutput[];
  nextSteps: string[]; // IDs of next steps
}

export interface StepConfig {
  // For prompt steps
  prompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  
  // For tool steps
  toolName?: string;
  toolParams?: Record<string, any>;
  
  // For condition steps
  condition?: string;
  trueSteps?: string[];
  falseSteps?: string[];
  
  // For transform steps
  transformation?: string;
  
  // For output steps
  format?: 'json' | 'markdown' | 'text' | 'csv';
  template?: string;
}

export interface StepInput {
  name: string;
  type: 'variable' | 'previous_step' | 'user_input' | 'file' | 'constant';
  source: string;
  required: boolean;
  defaultValue?: any;
  validation?: InputValidation;
}

export interface StepOutput {
  name: string;
  type: 'text' | 'json' | 'file' | 'url' | 'binary';
  description: string;
  saveAs?: string; // Variable name to save to
}

export interface InputValidation {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'file';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allowedValues?: any[];
  fileTypes?: string[];
  maxFileSize?: number;
}

export interface AgentVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'json';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: InputValidation;
  sensitive?: boolean; // For passwords, API keys, etc.
}

export interface ToolDefinition {
  name: string;
  type: 'web_search' | 'web_scrape' | 'code_analyzer' | 'file_processor' | 'custom';
  description: string;
  config: ToolConfig;
  requiredAuth?: string[]; // Required API keys
}

export interface ToolConfig {
  // Web search/scrape tools
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  
  // Custom tool config
  endpoint?: string;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  
  // Code analyzer config
  language?: string;
  rules?: string[];
  
  // File processor config
  supportedTypes?: string[];
  maxSize?: number;
}

export interface AgentSettings {
  maxExecutionTime: number;
  allowParallelExecution: boolean;
  errorHandling: 'stop' | 'continue' | 'retry';
  maxRetries: number;
  retryDelay: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  securityLevel: 'low' | 'medium' | 'high';
  resourceLimits: {
    maxMemory: number;
    maxCpuTime: number;
    maxFileSize: number;
  };
}

// Execution types
export interface AgentExecution {
  id: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  steps: StepExecution[];
  error?: string;
  logs: ExecutionLog[];
  metrics: ExecutionMetrics;
}

export interface StepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  error?: string;
  logs: string[];
  tokensUsed?: number;
  cost?: number;
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  stepId?: string;
  data?: any;
}

export interface ExecutionMetrics {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  totalTokensUsed: number;
  totalCost: number;
  averageStepDuration: number;
  executionEfficiency: number;
}

// Agent templates for common use cases
export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'code-review' | 'security' | 'research' | 'content' | 'automation' | 'custom';
  template: Partial<AgentDefinition>;
  requiredVariables: string[];
  requiredTools: string[];
  exampleInputs: Record<string, any>;
  documentation: string;
}

// Export types for tools
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
  tokensUsed?: number;
  cost?: number;
}

export interface ToolExecutionContext {
  agentId: string;
  executionId: string;
  stepId: string;
  variables: Record<string, any>;
  apiKeys: Record<string, string>;
  workingDir: string;
  tempDir: string;
  logger: (level: string, message: string, data?: any) => void;
}

// Agent marketplace types
export interface AgentMarketplaceEntry {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  rating: number;
  reviews: number;
  category: string;
  tags: string[];
  price: number; // 0 for free
  agentDefinition: AgentDefinition;
  screenshots: string[];
  documentation: string;
  changelog: string;
  requirements: string[];
  license: string;
  published: Date;
  updated: Date;
}

// Configuration types
export interface AgentBuilderConfig {
  maxAgents: number;
  maxExecutionsPerAgent: number;
  defaultExecutionTimeout: number;
  allowedTools: string[];
  apiKeyStorage: 'encrypted' | 'env' | 'prompt';
  workingDirectory: string;
  tempDirectory: string;
  logRetentionDays: number;
  marketplaceEnabled: boolean;
  marketplaceUrl?: string;
}