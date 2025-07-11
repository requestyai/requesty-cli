/**
 * @fileoverview Chat interface for general conversations
 * @author Requesty CLI Team
 * @license MIT
 * @copyright 2024 Requesty CLI Contributors
 */

import readline from 'readline';
import chalk from 'chalk';
import { ChatClient } from '../core/chat-client';
import { CLIConfig, ModelInfo } from '../../core/types';
import { ChatConfig } from '../types/chat-types';
import { ConsoleFormatter } from '../../ui/console-formatter';
import { FEATURED_MODELS, getDefaultChatModel, DEFAULT_SYSTEM_PROMPT } from '../config/featured-models';
import inquirer from 'inquirer';

export class ChatInterface {
  private rl: readline.Interface;
  private client: ChatClient;
  private isFirstMessage: boolean = true;
  private allModels: ModelInfo[] = [];
  private config: CLIConfig;

  constructor(config: CLIConfig, chatConfig: ChatConfig, allModels: ModelInfo[] = []) {
    this.config = config;
    this.client = new ChatClient(config, chatConfig);
    this.allModels = allModels;
    // Initialize readline interface later, after model selection
    this.rl = null as any;
  }

  /**
   * Initialize readline interface
   */
  private initializeReadline(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
  }

  /**
   * Start the chat interface
   */
  async start(): Promise<void> {
    try {
      // Display welcome
      this.displayWelcome();

      // Let user choose model
      const selectedModel = await this.selectModel();
      
      // Update client with selected model
      const chatConfig: ChatConfig = {
        model: selectedModel,
        temperature: 0.7,
        includeSystemPrompt: true,
        conversationHistory: true,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
      };

      // Create new client with selected model
      this.client = new ChatClient(this.config, chatConfig);
      
      // Initialize session
      await this.client.initializeSession();
      
      console.log(ConsoleFormatter.success(`\n🚀 Chat session started with ${selectedModel}`));
      console.log(ConsoleFormatter.info('💡 Start chatting! Type "help" for commands, "exit" to quit\n'));

      // Initialize readline interface NOW, after inquirer is done
      this.initializeReadline();

      // Start chat loop
      await this.chatLoop();

    } catch (error) {
      console.error('❌ Chat Interface Error:', error);
      ConsoleFormatter.printError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      if (this.client) {
        this.client.endSession();
      }
      if (this.rl) {
        this.rl.close();
      }
    }
  }

  /**
   * Model selection interface
   */
  private async selectModel(): Promise<string> {
    const choices = [];
    
    // Add featured models section
    choices.push(new inquirer.Separator('🌟 Featured Models (Recommended)'));
    FEATURED_MODELS.filter(m => m.recommended).forEach(model => {
      choices.push({
        name: `${model.name} (${model.provider}) - ${model.description}`,
        value: model.id,
        short: model.name,
      });
    });

    // Add recent models section
    const recentModels = this.getRecentModels();
    if (recentModels.length > 0) {
      choices.push(new inquirer.Separator('🆕 Recent Models'));
      recentModels.forEach(model => {
        const modelId = model.id || model.name || 'unknown';
        choices.push({
          name: `${modelId} - ${model.description || 'No description'}`,
          value: modelId,
          short: modelId.split('/').pop() || modelId,
        });
      });
    }

    // Add all other featured models
    const otherFeatured = FEATURED_MODELS.filter(m => !m.recommended);
    if (otherFeatured.length > 0) {
      choices.push(new inquirer.Separator('⚡ Other Featured Models'));
      otherFeatured.forEach(model => {
        choices.push({
          name: `${model.name} (${model.provider}) - ${model.description}`,
          value: model.id,
          short: model.name,
        });
      });
    }

    const { selectedModel } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedModel',
        message: '🤖 Choose an AI model for your chat:',
        choices,
        default: getDefaultChatModel(),
        pageSize: 15,
      },
    ]);

    return selectedModel;
  }

  /**
   * Get recent models sorted by creation date
   */
  private getRecentModels(): ModelInfo[] {
    if (!this.allModels.length) return [];

    // Sort by created timestamp (newest first) and take top 10
    return this.allModels
      .filter(model => model.created) // Only models with created timestamp
      .sort((a, b) => (b.created || 0) - (a.created || 0))
      .slice(0, 10) // Top 10 most recent
      .filter(model => {
        // Exclude models that are already in featured
        return !FEATURED_MODELS.some(featured => featured.id === (model.id || model.name));
      });
  }

  /**
   * Main chat loop
   */
  private async chatLoop(): Promise<void> {
    return new Promise((resolve) => {
      const askQuestion = () => {
        const promptText = this.isFirstMessage 
          ? '💬 You: '
          : '💬 You: ';
          
        this.rl.question(chalk.cyan(promptText), async (input) => {
          const trimmedInput = input.trim();

          // Handle special commands
          if (await this.handleSpecialCommand(trimmedInput, resolve)) {
            return;
          }

          // Handle empty input
          if (!trimmedInput) {
            console.log(ConsoleFormatter.info('Please enter a message or type "help" for commands.'));
            askQuestion();
            return;
          }

          try {
            // Process the message
            await this.processMessage(trimmedInput);
            askQuestion();
          } catch (error) {
            ConsoleFormatter.printError(error instanceof Error ? error.message : 'Unknown error');
            askQuestion();
          }
        });
      };

      askQuestion();
    });
  }

  /**
   * Handle special commands
   */
  private async handleSpecialCommand(input: string, resolve: () => void): Promise<boolean> {
    const command = input.toLowerCase();

    switch (command) {
      case 'exit':
      case 'quit':
        this.displayGoodbye();
        resolve();
        return true;

      case 'help':
        this.displayHelp();
        return true;

      case 'info':
        this.displaySessionInfo();
        return true;

      case 'summary':
        this.displayConversationSummary();
        return true;

      case 'clear':
        console.clear();
        this.displayWelcome();
        return true;

      default:
        return false;
    }
  }

  /**
   * Process a user message
   */
  private async processMessage(message: string): Promise<void> {
    console.log(ConsoleFormatter.assistant('\n🤖 AI: '));
    
    try {
      const response = await this.client.sendMessage(message);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get response');
      }

      console.log(ConsoleFormatter.info(`\n⏱️  Response time: ${response.responseTime}ms`));
      
      // Handle feedback if we have a request ID
      if (response.requestId) {
        await this.handleFeedback(response.requestId);
      }
      
      this.isFirstMessage = false;
    } catch (error) {
      throw new Error(`Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle feedback for responses
   */
  private async handleFeedback(requestId: string): Promise<void> {
    return new Promise((resolve) => {
      this.rl.question(chalk.cyan('\nGive feedback? (u = 👍, d = 👎, enter to skip): '), async (input) => {
        const trimmedInput = input.trim().toLowerCase();
        
        if (trimmedInput === 'u' || trimmedInput === 'd') {
          const thumbs = trimmedInput === 'u' ? 'up' : 'down';
          const emoji = thumbs === 'up' ? '👍' : '👎';
          
          try {
            console.log(ConsoleFormatter.info(`Sending feedback ${emoji}...`));
            const feedbackResult = await this.client.sendFeedback(requestId, thumbs);
            
            if (feedbackResult.success) {
              console.log(ConsoleFormatter.success(`✅ Feedback sent successfully! ${emoji}`));
            } else {
              console.log(ConsoleFormatter.info(`⚠️  Failed to send feedback: ${feedbackResult.error}`));
            }
          } catch (error) {
            console.log(ConsoleFormatter.info(`⚠️  Error sending feedback: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        } else if (trimmedInput === '') {
          // User pressed enter to skip
        } else {
          console.log(ConsoleFormatter.info('Invalid input. Skipping feedback.'));
        }
        
        resolve();
      });
    });
  }

  /**
   * Display welcome message
   */
  private displayWelcome(): void {
    console.log(ConsoleFormatter.header('\n🚀 Requesty AI Chat'));
    console.log(ConsoleFormatter.info('Your intelligent AI conversation companion'));
    console.log(ConsoleFormatter.info('Type "help" for commands, "exit" to quit\n'));
  }

  /**
   * Display help information
   */
  private displayHelp(): void {
    console.log(ConsoleFormatter.header('\n📖 Available Commands:'));
    console.log(ConsoleFormatter.info('• Type any message to chat with the AI'));
    console.log(ConsoleFormatter.info('• "info" - Show session information'));
    console.log(ConsoleFormatter.info('• "summary" - Show conversation summary'));
    console.log(ConsoleFormatter.info('• "clear" - Clear the screen'));
    console.log(ConsoleFormatter.info('• "help" - Show this help message'));
    console.log(ConsoleFormatter.info('• "exit" or "quit" - End the chat session'));
    console.log(ConsoleFormatter.separator());
  }

  /**
   * Display session information
   */
  private displaySessionInfo(): void {
    const session = this.client.getSession();
    if (!session) return;

    console.log(ConsoleFormatter.header('\n📊 Session Information:'));
    console.log(ConsoleFormatter.subheader(`🤖 Model: ${session.model}`));
    console.log(ConsoleFormatter.subheader(`💬 Total Messages: ${session.totalMessages}`));
    console.log(ConsoleFormatter.subheader(`🔢 Total Tokens: ${session.totalTokens}`));
    console.log(ConsoleFormatter.subheader(`🕒 Created: ${session.created.toLocaleString()}`));
    console.log(ConsoleFormatter.subheader(`📈 Status: ${session.status}`));
    console.log(ConsoleFormatter.separator());
  }

  /**
   * Display conversation summary
   */
  private displayConversationSummary(): void {
    const summary = this.client.getConversationSummary();
    if (!summary) return;

    console.log(ConsoleFormatter.header('\n📋 Conversation Summary:'));
    console.log(ConsoleFormatter.subheader(`🤖 Model: ${summary.model}`));
    console.log(ConsoleFormatter.subheader(`💬 Total Messages: ${summary.totalMessages}`));
    console.log(ConsoleFormatter.subheader(`👤 Your Messages: ${summary.userMessages}`));
    console.log(ConsoleFormatter.subheader(`🤖 AI Responses: ${summary.assistantResponses}`));
    console.log(ConsoleFormatter.subheader(`🔢 Total Tokens: ${summary.totalTokens}`));
    console.log(ConsoleFormatter.subheader(`📊 Total Characters: ${summary.totalCharacters.toLocaleString()}`));
    console.log(ConsoleFormatter.subheader(`⏱️  Session Duration: ${Math.round(summary.sessionDuration / 1000)}s`));
    console.log(ConsoleFormatter.separator());
  }

  /**
   * Display goodbye message
   */
  private displayGoodbye(): void {
    const summary = this.client.getConversationSummary();
    const messageCount = summary ? summary.userMessages : 0;
    const tokenCount = summary ? summary.totalTokens : 0;
    
    console.log(ConsoleFormatter.success('\n👋 Thank you for using Requesty AI Chat!'));
    console.log(ConsoleFormatter.info(`📊 Session completed with ${messageCount} messages and ${tokenCount} tokens`));
  }

  /**
   * Close the interface
   */
  close(): void {
    if (this.rl) {
      this.rl.close();
    }
  }
}