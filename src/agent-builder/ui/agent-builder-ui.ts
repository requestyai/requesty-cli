import chalk from 'chalk';
import inquirer from 'inquirer';
import { v4 as uuidv4 } from 'uuid';
import { AgentDefinition, AgentStep, AgentVariable, ToolDefinition, AgentTemplate } from '../types/agent-types';
import { AgentStore } from '../storage/agent-store';
import { AgentExecutor } from '../executor/agent-executor';
import { CLIConfig } from '../../core/types';

/**
 * Interactive UI for building and managing agents
 */
export class AgentBuilderUI {
  private store: AgentStore;
  private executor: AgentExecutor;

  constructor(config: CLIConfig) {
    this.store = new AgentStore();
    this.executor = new AgentExecutor(config);
  }

  /**
   * Show main agent builder menu
   */
  async showMainMenu(): Promise<void> {
    console.clear();
    console.log(chalk.cyan.bold('\n🤖 Agent Builder\n'));
    console.log(chalk.gray('Build custom AI agents and workflows\n'));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🆕 Create New Agent', value: 'create' },
          { name: '📋 List Agents', value: 'list' },
          { name: '▶️  Run Agent', value: 'run' },
          { name: '📝 Edit Agent', value: 'edit' },
          { name: '📊 View Execution History', value: 'history' },
          { name: '🗂️  Manage Templates', value: 'templates' },
          { name: '🔧 Settings', value: 'settings' },
          { name: '↩️  Back to Main Menu', value: 'back' }
        ]
      }
    ]);

    switch (action) {
      case 'create':
        await this.createAgent();
        break;
      case 'list':
        await this.listAgents();
        break;
      case 'run':
        await this.runAgent();
        break;
      case 'edit':
        await this.editAgent();
        break;
      case 'history':
        await this.viewExecutionHistory();
        break;
      case 'templates':
        await this.manageTemplates();
        break;
      case 'settings':
        await this.showSettings();
        break;
      case 'back':
        return;
    }

    // Show menu again unless user chose to go back
    if (action !== 'back') {
      await this.showMainMenu();
    }
  }

  /**
   * Create new agent
   */
  private async createAgent(): Promise<void> {
    console.log(chalk.yellow.bold('\n📋 Create New Agent\n'));

    // Check if user wants to use a template
    const { useTemplate } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useTemplate',
        message: 'Would you like to start from a template?',
        default: false
      }
    ]);

    let agent: AgentDefinition;

    if (useTemplate) {
      const template = await this.selectTemplate();
      if (!template) return;

      agent = {
        id: uuidv4(),
        name: template.name,
        description: template.description,
        version: '1.0.0',
        created: new Date(),
        updated: new Date(),
        author: 'User',
        tags: [],
        systemPrompt: template.template.systemPrompt || '',
        steps: template.template.steps || [],
        variables: template.template.variables || [],
        tools: template.template.tools || [],
        settings: template.template.settings || {
          maxExecutionTime: 300000,
          allowParallelExecution: false,
          errorHandling: 'stop',
          maxRetries: 3,
          retryDelay: 1000,
          logLevel: 'info',
          securityLevel: 'medium',
          resourceLimits: {
            maxMemory: 512,
            maxCpuTime: 60000,
            maxFileSize: 10485760
          }
        }
      };
    } else {
      // Create from scratch
      agent = await this.createAgentFromScratch();
    }

    // Basic agent information
    const basicInfo = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Agent name:',
        default: agent.name,
        validate: (input: string) => input.trim().length > 0 || 'Name cannot be empty'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Agent description:',
        default: agent.description,
        validate: (input: string) => input.trim().length > 0 || 'Description cannot be empty'
      },
      {
        type: 'input',
        name: 'tags',
        message: 'Tags (comma-separated):',
        default: agent.tags.join(', '),
        filter: (input: string) => input.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      }
    ]);

    agent.name = basicInfo.name;
    agent.description = basicInfo.description;
    agent.tags = basicInfo.tags;

    // System prompt
    const { systemPrompt } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'systemPrompt',
        message: 'System prompt (opens in editor):',
        default: agent.systemPrompt
      }
    ]);

    agent.systemPrompt = systemPrompt;

    // Variables
    agent.variables = await this.configureVariables(agent.variables);

    // Tools
    agent.tools = await this.configureTools(agent.tools);

    // Steps
    agent.steps = await this.configureSteps(agent.steps);

    // Save agent
    try {
      await this.store.saveAgent(agent);
      console.log(chalk.green(`\n✅ Agent '${agent.name}' created successfully!`));
    } catch (error) {
      console.log(chalk.red(`\n❌ Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }

    await this.waitForKey();
  }

  /**
   * Create agent from scratch
   */
  private async createAgentFromScratch(): Promise<AgentDefinition> {
    return {
      id: uuidv4(),
      name: '',
      description: '',
      version: '1.0.0',
      created: new Date(),
      updated: new Date(),
      author: 'User',
      tags: [],
      systemPrompt: '',
      steps: [],
      variables: [],
      tools: [],
      settings: {
        maxExecutionTime: 300000,
        allowParallelExecution: false,
        errorHandling: 'stop',
        maxRetries: 3,
        retryDelay: 1000,
        logLevel: 'info',
        securityLevel: 'medium',
        resourceLimits: {
          maxMemory: 512,
          maxCpuTime: 60000,
          maxFileSize: 10485760
        }
      }
    };
  }

  /**
   * Configure agent variables
   */
  private async configureVariables(existingVariables: AgentVariable[] = []): Promise<AgentVariable[]> {
    const variables = [...existingVariables];

    while (true) {
      console.log(chalk.yellow('\n📋 Configure Variables\n'));
      
      if (variables.length > 0) {
        console.log('Current variables:');
        variables.forEach((v, i) => {
          console.log(`${i + 1}. ${v.name} (${v.type}) ${v.required ? '- Required' : '- Optional'}`);
        });
        console.log();
      }

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '➕ Add Variable', value: 'add' },
            { name: '📝 Edit Variable', value: 'edit', disabled: variables.length === 0 },
            { name: '🗑️  Remove Variable', value: 'remove', disabled: variables.length === 0 },
            { name: '✅ Done', value: 'done' }
          ]
        }
      ]);

      switch (action) {
        case 'add':
          const newVariable = await this.createVariable();
          if (newVariable) {
            variables.push(newVariable);
          }
          break;
        case 'edit':
          await this.editVariable(variables);
          break;
        case 'remove':
          await this.removeVariable(variables);
          break;
        case 'done':
          return variables;
      }
    }
  }

  /**
   * Create new variable
   */
  private async createVariable(): Promise<AgentVariable | null> {
    try {
      const variable = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Variable name:',
          validate: (input: string) => {
            if (!input.trim()) return 'Name cannot be empty';
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input)) return 'Name must be a valid identifier';
            return true;
          }
        },
        {
          type: 'list',
          name: 'type',
          message: 'Variable type:',
          choices: ['string', 'number', 'boolean', 'file', 'json']
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description:',
          validate: (input: string) => input.trim().length > 0 || 'Description cannot be empty'
        },
        {
          type: 'confirm',
          name: 'required',
          message: 'Is this variable required?',
          default: true
        },
        {
          type: 'input',
          name: 'defaultValue',
          message: 'Default value (optional):',
          when: (answers) => !answers.required
        }
      ]);

      return variable as AgentVariable;
    } catch (error) {
      return null;
    }
  }

  /**
   * Configure agent tools
   */
  private async configureTools(existingTools: ToolDefinition[] = []): Promise<ToolDefinition[]> {
    const tools = [...existingTools];

    while (true) {
      console.log(chalk.yellow('\n🔧 Configure Tools\n'));
      
      if (tools.length > 0) {
        console.log('Current tools:');
        tools.forEach((t, i) => {
          console.log(`${i + 1}. ${t.name} (${t.type})`);
        });
        console.log();
      }

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '➕ Add Tool', value: 'add' },
            { name: '🗑️  Remove Tool', value: 'remove', disabled: tools.length === 0 },
            { name: '✅ Done', value: 'done' }
          ]
        }
      ]);

      switch (action) {
        case 'add':
          const newTool = await this.selectTool();
          if (newTool) {
            tools.push(newTool);
          }
          break;
        case 'remove':
          await this.removeTool(tools);
          break;
        case 'done':
          return tools;
      }
    }
  }

  /**
   * Select tool to add
   */
  private async selectTool(): Promise<ToolDefinition | null> {
    const { toolType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'toolType',
        message: 'Select tool type:',
        choices: [
          { name: '🕸️  Web Search & Scraping (Firecrawl)', value: 'web_search' },
          { name: '🔍 Code Analyzer', value: 'code_analyzer' },
          { name: '🔧 Custom Tool', value: 'custom' }
        ]
      }
    ]);

    switch (toolType) {
      case 'web_search':
        return {
          name: 'firecrawl',
          type: 'web_search',
          description: 'Web scraping and search using Firecrawl API',
          config: {},
          requiredAuth: ['firecrawl_api_key']
        };
      case 'code_analyzer':
        return {
          name: 'code_analyzer',
          type: 'code_analyzer',
          description: 'Static code analysis for security and quality',
          config: {},
          requiredAuth: []
        };
      case 'custom':
        // TODO: Implement custom tool configuration
        console.log(chalk.yellow('Custom tools not yet implemented'));
        return null;
      default:
        return null;
    }
  }

  /**
   * Configure agent steps
   */
  private async configureSteps(existingSteps: AgentStep[] = []): Promise<AgentStep[]> {
    const steps = [...existingSteps];

    while (true) {
      console.log(chalk.yellow('\n⚡ Configure Steps\n'));
      
      if (steps.length > 0) {
        console.log('Current steps:');
        steps.forEach((s, i) => {
          console.log(`${i + 1}. ${s.name} (${s.type})`);
        });
        console.log();
      }

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '➕ Add Step', value: 'add' },
            { name: '📝 Edit Step', value: 'edit', disabled: steps.length === 0 },
            { name: '🗑️  Remove Step', value: 'remove', disabled: steps.length === 0 },
            { name: '↕️  Reorder Steps', value: 'reorder', disabled: steps.length < 2 },
            { name: '✅ Done', value: 'done' }
          ]
        }
      ]);

      switch (action) {
        case 'add':
          const newStep = await this.createStep(steps.length);
          if (newStep) {
            steps.push(newStep);
          }
          break;
        case 'edit':
          await this.editStep(steps);
          break;
        case 'remove':
          await this.removeStep(steps);
          break;
        case 'reorder':
          await this.reorderSteps(steps);
          break;
        case 'done':
          return steps;
      }
    }
  }

  /**
   * Create new step
   */
  private async createStep(order: number): Promise<AgentStep | null> {
    try {
      const basicInfo = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Step name:',
          validate: (input: string) => input.trim().length > 0 || 'Name cannot be empty'
        },
        {
          type: 'list',
          name: 'type',
          message: 'Step type:',
          choices: [
            { name: '💬 Prompt (AI completion)', value: 'prompt' },
            { name: '🔧 Tool (External tool)', value: 'tool' },
            { name: '❓ Condition (If/then logic)', value: 'condition' },
            { name: '🔄 Transform (Data processing)', value: 'transform' },
            { name: '📤 Output (Format result)', value: 'output' }
          ]
        }
      ]);

      const step: AgentStep = {
        id: uuidv4(),
        name: basicInfo.name,
        type: basicInfo.type,
        order,
        enabled: true,
        config: {},
        inputs: [],
        outputs: [],
        nextSteps: []
      };

      // Configure step based on type
      switch (basicInfo.type) {
        case 'prompt':
          step.config = await this.configurePromptStep();
          break;
        case 'tool':
          step.config = await this.configureToolStep();
          break;
        case 'condition':
          step.config = await this.configureConditionStep();
          break;
        case 'transform':
          step.config = await this.configureTransformStep();
          break;
        case 'output':
          step.config = await this.configureOutputStep();
          break;
      }

      return step;
    } catch (error) {
      return null;
    }
  }

  /**
   * Configure prompt step
   */
  private async configurePromptStep(): Promise<any> {
    const config = await inquirer.prompt([
      {
        type: 'editor',
        name: 'prompt',
        message: 'Prompt template (use {variable} for substitution):',
        default: 'Analyze the following: {input}'
      },
      {
        type: 'list',
        name: 'model',
        message: 'AI model:',
        choices: [
          'openai/gpt-4o',
          'openai/gpt-4',
          'anthropic/claude-3-5-sonnet-20241022',
          'anthropic/claude-sonnet-4-20250514',
          'google/gemini-2.5-flash',
          'google/gemini-2.5-pro'
        ],
        default: 'openai/gpt-4o'
      },
      {
        type: 'number',
        name: 'temperature',
        message: 'Temperature (0-2):',
        default: 0.7,
        validate: (input: number) => (input >= 0 && input <= 2) || 'Temperature must be between 0 and 2'
      },
      {
        type: 'number',
        name: 'maxTokens',
        message: 'Max tokens:',
        default: 2000,
        validate: (input: number) => input > 0 || 'Max tokens must be greater than 0'
      }
    ]);

    return config;
  }

  /**
   * Configure tool step
   */
  private async configureToolStep(): Promise<any> {
    const { toolName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'toolName',
        message: 'Select tool:',
        choices: [
          { name: '🕸️  Firecrawl (Web scraping)', value: 'firecrawl' },
          { name: '🔍 Code Analyzer', value: 'code_analyzer' }
        ]
      }
    ]);

    let toolParams: any = {};

    if (toolName === 'firecrawl') {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Firecrawl action:',
          choices: [
            { name: 'Scrape URL', value: 'scrape_url' },
            { name: 'Search Web', value: 'search_web' },
            { name: 'Crawl Website', value: 'crawl_website' }
          ]
        }
      ]);

      toolParams = { action };
    } else if (toolName === 'code_analyzer') {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Code analyzer action:',
          choices: [
            { name: 'Analyze Diff', value: 'analyze_diff' },
            { name: 'Analyze File', value: 'analyze_file' }
          ]
        }
      ]);

      toolParams = { action };
    }

    return {
      toolName,
      toolParams
    };
  }

  /**
   * Configure condition step
   */
  private async configureConditionStep(): Promise<any> {
    const config = await inquirer.prompt([
      {
        type: 'input',
        name: 'condition',
        message: 'Condition (use {variable} for substitution):',
        default: '{status} == "success"',
        validate: (input: string) => input.trim().length > 0 || 'Condition cannot be empty'
      }
    ]);

    return config;
  }

  /**
   * Configure transform step
   */
  private async configureTransformStep(): Promise<any> {
    const config = await inquirer.prompt([
      {
        type: 'list',
        name: 'transformation',
        message: 'Transformation type:',
        choices: [
          { name: 'To JSON', value: 'to_json' },
          { name: 'From JSON', value: 'from_json' },
          { name: 'To Uppercase', value: 'to_uppercase' },
          { name: 'To Lowercase', value: 'to_lowercase' }
        ]
      }
    ]);

    return config;
  }

  /**
   * Configure output step
   */
  private async configureOutputStep(): Promise<any> {
    const config = await inquirer.prompt([
      {
        type: 'list',
        name: 'format',
        message: 'Output format:',
        choices: [
          { name: 'JSON', value: 'json' },
          { name: 'Markdown', value: 'markdown' },
          { name: 'Text', value: 'text' }
        ]
      },
      {
        type: 'input',
        name: 'template',
        message: 'Output template (optional):',
        when: (answers) => answers.format === 'text'
      }
    ]);

    return config;
  }

  /**
   * List all agents
   */
  private async listAgents(): Promise<void> {
    try {
      const agents = await this.store.listAgents();
      
      if (agents.length === 0) {
        console.log(chalk.yellow('\n📭 No agents found. Create your first agent!\n'));
        await this.waitForKey();
        return;
      }

      console.log(chalk.cyan.bold('\n📋 Your Agents\n'));
      
      agents.forEach((agent, index) => {
        console.log(`${index + 1}. ${chalk.bold(agent.name)}`);
        console.log(`   ${chalk.gray(agent.description)}`);
        console.log(`   ${chalk.blue('Created:')} ${agent.created.toLocaleDateString()}`);
        console.log(`   ${chalk.green('Tags:')} ${agent.tags.join(', ') || 'None'}`);
        console.log();
      });

      await this.waitForKey();
    } catch (error) {
      console.log(chalk.red(`\n❌ Failed to list agents: ${error instanceof Error ? error.message : 'Unknown error'}`));
      await this.waitForKey();
    }
  }

  /**
   * Run an agent
   */
  private async runAgent(): Promise<void> {
    try {
      const agents = await this.store.listAgents();
      
      if (agents.length === 0) {
        console.log(chalk.yellow('\n📭 No agents found. Create your first agent!\n'));
        await this.waitForKey();
        return;
      }

      const { agentId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'agentId',
          message: 'Select agent to run:',
          choices: agents.map(agent => ({
            name: `${agent.name} - ${agent.description}`,
            value: agent.id
          }))
        }
      ]);

      const agent = await this.store.loadAgent(agentId);
      
      // Collect inputs for agent variables
      const inputs: Record<string, any> = {};
      
      if (agent.variables.length > 0) {
        console.log(chalk.yellow('\n📝 Provide input values:\n'));
        
        for (const variable of agent.variables) {
          const { value } = await inquirer.prompt([
            {
              type: variable.type === 'boolean' ? 'confirm' : 'input',
              name: 'value',
              message: `${variable.name} (${variable.description}):`,
              default: variable.defaultValue,
              validate: (input: any) => {
                if (variable.required && !input) {
                  return 'This field is required';
                }
                return true;
              }
            }
          ]);
          
          inputs[variable.name] = value;
        }
      }

      // Collect API keys for required tools
      const apiKeys: Record<string, string> = {};
      
      for (const tool of agent.tools) {
        if (tool.requiredAuth) {
          for (const authKey of tool.requiredAuth) {
            if (!apiKeys[authKey]) {
              const { key } = await inquirer.prompt([
                {
                  type: 'password',
                  name: 'key',
                  message: `Enter ${authKey}:`,
                  mask: '*',
                  validate: (input: string) => input.trim().length > 0 || 'API key cannot be empty'
                }
              ]);
              
              apiKeys[authKey] = key;
            }
          }
        }
      }

      console.log(chalk.blue('\n🚀 Executing agent...\n'));
      
      const execution = await this.executor.executeAgent(agentId, inputs, apiKeys);
      
      console.log(chalk.green('\n✅ Agent execution completed!\n'));
      console.log(chalk.bold('Results:'));
      console.log(JSON.stringify(execution.outputs, null, 2));
      
      if (execution.error) {
        console.log(chalk.red('\n❌ Execution failed:'));
        console.log(execution.error);
      }

      await this.waitForKey();
    } catch (error) {
      console.log(chalk.red(`\n❌ Failed to run agent: ${error instanceof Error ? error.message : 'Unknown error'}`));
      await this.waitForKey();
    }
  }

  /**
   * Wait for user to press any key
   */
  private async waitForKey(): Promise<void> {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue...'
      }
    ]);
  }

  // TODO: Implement remaining methods (editAgent, viewExecutionHistory, manageTemplates, etc.)
  private async editAgent(): Promise<void> {
    console.log(chalk.yellow('Edit agent functionality coming soon...'));
    await this.waitForKey();
  }

  private async viewExecutionHistory(): Promise<void> {
    console.log(chalk.yellow('Execution history functionality coming soon...'));
    await this.waitForKey();
  }

  private async manageTemplates(): Promise<void> {
    console.log(chalk.yellow('Template management functionality coming soon...'));
    await this.waitForKey();
  }

  private async showSettings(): Promise<void> {
    console.log(chalk.yellow('Settings functionality coming soon...'));
    await this.waitForKey();
  }

  private async selectTemplate(): Promise<AgentTemplate | null> {
    console.log(chalk.yellow('Template selection functionality coming soon...'));
    return null;
  }

  private async editVariable(variables: AgentVariable[]): Promise<void> {
    console.log(chalk.yellow('Edit variable functionality coming soon...'));
  }

  private async removeVariable(variables: AgentVariable[]): Promise<void> {
    console.log(chalk.yellow('Remove variable functionality coming soon...'));
  }

  private async removeTool(tools: ToolDefinition[]): Promise<void> {
    console.log(chalk.yellow('Remove tool functionality coming soon...'));
  }

  private async editStep(steps: AgentStep[]): Promise<void> {
    console.log(chalk.yellow('Edit step functionality coming soon...'));
  }

  private async removeStep(steps: AgentStep[]): Promise<void> {
    console.log(chalk.yellow('Remove step functionality coming soon...'));
  }

  private async reorderSteps(steps: AgentStep[]): Promise<void> {
    console.log(chalk.yellow('Reorder steps functionality coming soon...'));
  }
}