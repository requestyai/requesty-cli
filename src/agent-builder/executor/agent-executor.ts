import { v4 as uuidv4 } from 'uuid';
import { RequestyAPI } from '../../core/api';
import { CLIConfig } from '../../core/types';
import { AgentDefinition, AgentExecution, AgentStep, StepExecution, ExecutionLog, ToolExecutionContext, ToolResult } from '../types/agent-types';
import { AgentStore } from '../storage/agent-store';
import { FirecrawlTool } from '../tools/firecrawl-tool';
import { CodeAnalyzerTool } from '../tools/code-analyzer-tool';

/**
 * Agent execution engine
 */
export class AgentExecutor {
  private api: RequestyAPI;
  private store: AgentStore;
  private tools: Map<string, any>;
  private executions: Map<string, AgentExecution>;

  constructor(config: CLIConfig) {
    this.api = new RequestyAPI(config);
    this.store = new AgentStore();
    this.tools = new Map();
    this.executions = new Map();
    
    // Initialize built-in tools
    this.initializeTools();
  }

  /**
   * Initialize built-in tools
   */
  private initializeTools(): void {
    // Code analyzer tool (no API key required)
    this.tools.set('code_analyzer', new CodeAnalyzerTool());
    
    // Firecrawl tool will be initialized when needed with API key
  }

  /**
   * Execute an agent with given inputs
   */
  async executeAgent(
    agentId: string,
    inputs: Record<string, any>,
    apiKeys: Record<string, string> = {}
  ): Promise<AgentExecution> {
    try {
      // Load agent definition
      const agent = await this.store.loadAgent(agentId);
      
      // Create execution record
      const execution: AgentExecution = {
        id: uuidv4(),
        agentId,
        status: 'running',
        startTime: new Date(),
        inputs,
        outputs: {},
        steps: [],
        logs: [],
        metrics: {
          totalSteps: agent.steps.length,
          completedSteps: 0,
          failedSteps: 0,
          skippedSteps: 0,
          totalTokensUsed: 0,
          totalCost: 0,
          averageStepDuration: 0,
          executionEfficiency: 0
        }
      };

      this.executions.set(execution.id, execution);
      
      this.log(execution, 'info', `Starting agent execution: ${agent.name}`, { agentId, inputs });

      // Initialize tools with API keys
      await this.initializeToolsWithKeys(apiKeys, execution);

      // Validate inputs
      const validationResult = this.validateInputs(agent, inputs);
      if (!validationResult.valid) {
        throw new Error(`Input validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Create execution context
      const context: ToolExecutionContext = {
        agentId,
        executionId: execution.id,
        stepId: '',
        variables: { ...inputs },
        apiKeys,
        workingDir: process.cwd(),
        tempDir: '/tmp',
        logger: (level: string, message: string, data?: any) => {
          this.log(execution, level as any, message, data);
        }
      };

      // Execute steps
      await this.executeSteps(agent, execution, context);

      // Finalize execution
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      execution.status = execution.steps.some(s => s.status === 'failed') ? 'failed' : 'completed';

      // Calculate metrics
      execution.metrics.completedSteps = execution.steps.filter(s => s.status === 'completed').length;
      execution.metrics.failedSteps = execution.steps.filter(s => s.status === 'failed').length;
      execution.metrics.skippedSteps = execution.steps.filter(s => s.status === 'skipped').length;
      execution.metrics.averageStepDuration = execution.steps.reduce((sum, s) => sum + (s.duration || 0), 0) / execution.steps.length;
      execution.metrics.executionEfficiency = (execution.metrics.completedSteps / execution.metrics.totalSteps) * 100;

      // Save execution
      await this.store.saveExecution(execution);

      this.log(execution, 'info', `Agent execution completed: ${execution.status}`, {
        duration: execution.duration,
        metrics: execution.metrics
      });

      return execution;
    } catch (error) {
      const execution = this.executions.get(agentId);
      if (execution) {
        execution.status = 'failed';
        execution.error = error instanceof Error ? error.message : 'Unknown error';
        execution.endTime = new Date();
        execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
        
        await this.store.saveExecution(execution);
      }
      
      throw error;
    }
  }

  /**
   * Initialize tools with API keys
   */
  private async initializeToolsWithKeys(apiKeys: Record<string, string>, execution: AgentExecution): Promise<void> {
    // Initialize Firecrawl tool if API key is provided
    if (apiKeys.firecrawl_api_key) {
      this.tools.set('firecrawl', new FirecrawlTool(apiKeys.firecrawl_api_key));
      this.log(execution, 'info', 'Initialized Firecrawl tool');
    }

    // Add other tools as needed
  }

  /**
   * Validate inputs against agent requirements
   */
  private validateInputs(agent: AgentDefinition, inputs: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const variable of agent.variables) {
      if (variable.required && !(variable.name in inputs)) {
        errors.push(`Required variable '${variable.name}' is missing`);
      }

      if (variable.name in inputs) {
        const value = inputs[variable.name];
        const validation = variable.validation;

        if (validation) {
          if (validation.type === 'string' && typeof value !== 'string') {
            errors.push(`Variable '${variable.name}' must be a string`);
          }
          if (validation.type === 'number' && typeof value !== 'number') {
            errors.push(`Variable '${variable.name}' must be a number`);
          }
          if (validation.minLength && value.length < validation.minLength) {
            errors.push(`Variable '${variable.name}' must be at least ${validation.minLength} characters`);
          }
          if (validation.maxLength && value.length > validation.maxLength) {
            errors.push(`Variable '${variable.name}' must not exceed ${validation.maxLength} characters`);
          }
          if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
            errors.push(`Variable '${variable.name}' does not match required pattern`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Execute agent steps
   */
  private async executeSteps(agent: AgentDefinition, execution: AgentExecution, context: ToolExecutionContext): Promise<void> {
    const sortedSteps = agent.steps.sort((a, b) => a.order - b.order);
    
    for (const step of sortedSteps) {
      if (!step.enabled) {
        this.log(execution, 'info', `Skipping disabled step: ${step.name}`);
        continue;
      }

      await this.executeStep(step, execution, context);
      
      // Check if execution should be stopped
      if (execution.status === 'failed' && agent.settings.errorHandling === 'stop') {
        break;
      }
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: AgentStep, execution: AgentExecution, context: ToolExecutionContext): Promise<void> {
    const stepExecution: StepExecution = {
      stepId: step.id,
      status: 'running',
      startTime: new Date(),
      inputs: {},
      outputs: {},
      logs: []
    };

    execution.steps.push(stepExecution);
    context.stepId = step.id;

    this.log(execution, 'info', `Executing step: ${step.name}`, { stepId: step.id, type: step.type });

    try {
      // Prepare inputs
      stepExecution.inputs = await this.prepareStepInputs(step, context);

      // Execute step based on type
      switch (step.type) {
        case 'prompt':
          stepExecution.outputs = await this.executePromptStep(step, stepExecution.inputs, context);
          break;
        case 'tool':
          stepExecution.outputs = await this.executeToolStep(step, stepExecution.inputs, context);
          break;
        case 'condition':
          stepExecution.outputs = await this.executeConditionStep(step, stepExecution.inputs, context);
          break;
        case 'transform':
          stepExecution.outputs = await this.executeTransformStep(step, stepExecution.inputs, context);
          break;
        case 'output':
          stepExecution.outputs = await this.executeOutputStep(step, stepExecution.inputs, context);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      // Update context variables with outputs
      for (const output of step.outputs) {
        if (output.saveAs && stepExecution.outputs[output.name]) {
          context.variables[output.saveAs] = stepExecution.outputs[output.name];
        }
      }

      stepExecution.status = 'completed';
      stepExecution.endTime = new Date();
      stepExecution.duration = stepExecution.endTime.getTime() - stepExecution.startTime.getTime();

      execution.metrics.completedSteps++;
      
      this.log(execution, 'info', `Step completed: ${step.name}`, { 
        stepId: step.id, 
        duration: stepExecution.duration,
        outputKeys: Object.keys(stepExecution.outputs)
      });

    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.error = error instanceof Error ? error.message : 'Unknown error';
      stepExecution.endTime = new Date();
      stepExecution.duration = stepExecution.endTime.getTime() - stepExecution.startTime.getTime();

      execution.metrics.failedSteps++;
      
      this.log(execution, 'error', `Step failed: ${step.name}`, { 
        stepId: step.id, 
        error: stepExecution.error 
      });

      if (execution.status !== 'failed') {
        execution.status = 'failed';
      }
    }
  }

  /**
   * Prepare step inputs by resolving variables and references
   */
  private async prepareStepInputs(step: AgentStep, context: ToolExecutionContext): Promise<Record<string, any>> {
    const inputs: Record<string, any> = {};

    for (const input of step.inputs) {
      let value: any;

      switch (input.type) {
        case 'variable':
          value = context.variables[input.source];
          break;
        case 'constant':
          value = input.source;
          break;
        case 'user_input':
          value = context.variables[input.source];
          break;
        case 'previous_step':
          // TODO: Implement previous step output reference
          value = input.defaultValue;
          break;
        case 'file':
          // TODO: Implement file reading
          value = input.defaultValue;
          break;
        default:
          value = input.defaultValue;
      }

      if (value === undefined && input.required) {
        throw new Error(`Required input '${input.name}' is missing`);
      }

      inputs[input.name] = value !== undefined ? value : input.defaultValue;
    }

    return inputs;
  }

  /**
   * Execute prompt step
   */
  private async executePromptStep(step: AgentStep, inputs: Record<string, any>, context: ToolExecutionContext): Promise<Record<string, any>> {
    const prompt = this.interpolateTemplate(step.config.prompt || '', context.variables);
    const model = step.config.model || 'openai/gpt-4o';
    const temperature = step.config.temperature || 0.7;
    const maxTokens = step.config.maxTokens || 2000;

    this.log(context, 'info', `Executing prompt with model: ${model}`, { prompt: prompt.substring(0, 200) + '...' });

    const result = await this.api.testModel(model, prompt);
    
    if (!result.success) {
      throw new Error(`Prompt execution failed: ${result.error}`);
    }

    const response = result.response?.choices[0]?.message?.content || '';
    const tokensUsed = result.response?.usage?.total_tokens || 0;
    const cost = 0; // TODO: Calculate actual cost

    // Update metrics
    const execution = this.executions.get(context.executionId);
    if (execution) {
      execution.metrics.totalTokensUsed += tokensUsed;
      execution.metrics.totalCost += cost;
    }

    return {
      response,
      tokensUsed,
      cost,
      model,
      prompt
    };
  }

  /**
   * Execute tool step
   */
  private async executeToolStep(step: AgentStep, inputs: Record<string, any>, context: ToolExecutionContext): Promise<Record<string, any>> {
    const toolName = step.config.toolName;
    const toolParams = step.config.toolParams || {};

    if (!toolName) {
      throw new Error('Tool name is required for tool steps');
    }

    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found or not initialized`);
    }

    this.log(context, 'info', `Executing tool: ${toolName}`, { toolParams });

    let result: ToolResult;

    // Execute tool based on type
    switch (toolName) {
      case 'firecrawl':
        if (toolParams.action === 'scrape_url') {
          result = await tool.scrapeUrl(inputs.url || toolParams.url, toolParams.options || {}, context);
        } else if (toolParams.action === 'search_web') {
          result = await tool.searchWeb(inputs.query || toolParams.query, toolParams.options || {}, context);
        } else if (toolParams.action === 'crawl_website') {
          result = await tool.crawlWebsite(inputs.url || toolParams.url, toolParams.options || {}, context);
        } else {
          throw new Error(`Unknown Firecrawl action: ${toolParams.action}`);
        }
        break;
      
      case 'code_analyzer':
        if (toolParams.action === 'analyze_diff') {
          result = await tool.analyzeDiff(inputs.diff || toolParams.diff, toolParams.options || {}, context);
        } else if (toolParams.action === 'analyze_file') {
          result = await tool.analyzeFile(inputs.filePath || toolParams.filePath, inputs.source || toolParams.source, toolParams.options || {}, context);
        } else {
          throw new Error(`Unknown code analyzer action: ${toolParams.action}`);
        }
        break;
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    if (!result.success) {
      throw new Error(`Tool execution failed: ${result.error}`);
    }

    return {
      toolResult: result.data,
      toolMetadata: result.metadata,
      toolName,
      success: result.success
    };
  }

  /**
   * Execute condition step
   */
  private async executeConditionStep(step: AgentStep, inputs: Record<string, any>, context: ToolExecutionContext): Promise<Record<string, any>> {
    const condition = step.config.condition;
    if (!condition) {
      throw new Error('Condition is required for condition steps');
    }

    // Simple condition evaluation (in production, use a proper expression evaluator)
    const result = this.evaluateCondition(condition, context.variables);
    
    return {
      conditionResult: result,
      nextSteps: result ? step.config.trueSteps : step.config.falseSteps
    };
  }

  /**
   * Execute transform step
   */
  private async executeTransformStep(step: AgentStep, inputs: Record<string, any>, context: ToolExecutionContext): Promise<Record<string, any>> {
    const transformation = step.config.transformation;
    if (!transformation) {
      throw new Error('Transformation is required for transform steps');
    }

    // Simple transformations (in production, use a proper transformation engine)
    let result: any;

    switch (transformation) {
      case 'to_json':
        result = JSON.stringify(inputs.data);
        break;
      case 'from_json':
        result = JSON.parse(inputs.data);
        break;
      case 'to_uppercase':
        result = inputs.data.toString().toUpperCase();
        break;
      case 'to_lowercase':
        result = inputs.data.toString().toLowerCase();
        break;
      default:
        throw new Error(`Unknown transformation: ${transformation}`);
    }

    return {
      transformedData: result,
      transformation
    };
  }

  /**
   * Execute output step
   */
  private async executeOutputStep(step: AgentStep, inputs: Record<string, any>, context: ToolExecutionContext): Promise<Record<string, any>> {
    const format = step.config.format || 'json';
    const template = step.config.template;

    let output: any;

    switch (format) {
      case 'json':
        output = JSON.stringify(inputs, null, 2);
        break;
      case 'text':
        output = template ? this.interpolateTemplate(template, inputs) : JSON.stringify(inputs);
        break;
      case 'markdown':
        output = this.formatAsMarkdown(inputs);
        break;
      default:
        output = inputs;
    }

    // Update execution outputs
    const execution = this.executions.get(context.executionId);
    if (execution) {
      execution.outputs = { ...execution.outputs, ...inputs };
    }

    return {
      formattedOutput: output,
      format,
      rawData: inputs
    };
  }

  /**
   * Interpolate template with variables
   */
  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, String(value));
    }
    
    return result;
  }

  /**
   * Evaluate simple conditions
   */
  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    // Simple condition evaluation (in production, use a proper expression evaluator)
    const interpolated = this.interpolateTemplate(condition, variables);
    
    // Basic evaluations
    if (interpolated === 'true') return true;
    if (interpolated === 'false') return false;
    if (interpolated.includes('==')) {
      const [left, right] = interpolated.split('==').map(s => s.trim());
      return left === right;
    }
    if (interpolated.includes('!=')) {
      const [left, right] = interpolated.split('!=').map(s => s.trim());
      return left !== right;
    }
    
    return false;
  }

  /**
   * Format data as markdown
   */
  private formatAsMarkdown(data: Record<string, any>): string {
    let markdown = '# Agent Output\n\n';
    
    for (const [key, value] of Object.entries(data)) {
      markdown += `## ${key}\n\n`;
      if (typeof value === 'string') {
        markdown += `${value}\n\n`;
      } else {
        markdown += `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n\n`;
      }
    }
    
    return markdown;
  }

  /**
   * Log execution events
   */
  private log(execution: AgentExecution | ToolExecutionContext, level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logEntry: ExecutionLog = {
      timestamp: new Date(),
      level,
      message,
      data
    };

    // Check if it's an AgentExecution or ToolExecutionContext
    if ('logs' in execution) {
      execution.logs.push(logEntry);
    } else {
      // For ToolExecutionContext, get the actual execution
      const actualExecution = this.executions.get(execution.executionId);
      if (actualExecution) {
        actualExecution.logs.push(logEntry);
      }
    }
    
    // Also log to console for debugging
    console.log(`[${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): AgentExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      
      await this.store.saveExecution(execution);
    }
  }

  /**
   * Get available tools
   */
  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }
}