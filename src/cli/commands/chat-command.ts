/**
 * @fileoverview Chat command for regular AI conversations
 * @author Requesty CLI Team
 * @license MIT
 * @copyright 2024 Requesty CLI Contributors
 */

import { BaseCommand } from './base-command';
import { RequestyAPI } from '../../core/api';
import { TerminalUI } from '../../ui/terminal-ui';
import { CLIConfig, ModelInfo } from '../../core/types';
import { ErrorHandler } from '../../utils/error-handler';
import { ChatInterface } from '../../chat/ui/chat-interface';
import { ChatConfig } from '../../chat/types/chat-types';
import { getDefaultChatModel, DEFAULT_SYSTEM_PROMPT } from '../../chat/config/featured-models';

/**
 * Chat command for interactive AI conversations
 * Provides a ChatGPT-like experience in the CLI
 */
export class ChatCommand extends BaseCommand {
  private api: RequestyAPI;
  private ui: TerminalUI;
  private config: CLIConfig;

  constructor(api: RequestyAPI, ui: TerminalUI, config: CLIConfig) {
    super('chat', 'Start an interactive AI chat session');
    this.api = api;
    this.ui = ui;
    this.config = config;
  }

  /**
   * Execute the chat command
   * @param args - Command arguments [model?]
   * @returns Promise that resolves when command completes
   */
  protected async run(args: any[]): Promise<any> {
    try {
      // Parse arguments
      const modelId = args[0] || null;

      // Get all available models for selection
      const allModels = await this.api.getModels();

      // Create chat configuration
      const chatConfig: ChatConfig = {
        model: modelId || getDefaultChatModel(),
        temperature: this.config.temperature || 0.7,
        includeSystemPrompt: true,
        conversationHistory: true,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
      };

      // Create and start chat interface
      const chatInterface = new ChatInterface(this.config, chatConfig, allModels);
      await chatInterface.start();

      return this.createResult(true, null, 'Chat session ended');
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Chat command');
    }
  }

  /**
   * Display command-specific help
   */
  protected displaySpecificHelp(): void {
    console.log(`
Usage: requesty chat [model]

Start an interactive AI chat session with continuous conversation.

Options:
  [model]     Optional model ID to use (e.g., "openai/gpt-4o")
              If not specified, you'll be prompted to choose

Features:
  - Continuous conversation with context retention
  - Model selection with featured and recent models
  - Real-time streaming responses
  - Conversation history and summaries
  - Feedback system for quality improvement
  - Multiple model providers supported

Commands during chat:
  help        Show available commands
  info        Display session information
  summary     Show conversation summary
  clear       Clear the screen
  exit/quit   End the chat session

Examples:
  requesty chat
  requesty chat openai/gpt-4o
  requesty chat anthropic/claude-sonnet-4-20250514

Featured Models:
  - OpenAI: GPT-4o, GPT-4.1 Turbo
  - Anthropic: Claude Sonnet 4, Claude Haiku 4
  - Google: Gemini 2.5 Flash, Gemini 2.0 Pro
  - And many more...
`);
  }

  /**
   * Get command category
   * @returns Command category
   */
  protected getCategory(): string {
    return 'interaction';
  }

  /**
   * Check if command requires authentication
   * @returns True if authentication required
   */
  protected requiresAuthentication(): boolean {
    return true;
  }

  /**
   * Check if command requires user interaction
   * @returns True if user interaction required
   */
  protected requiresUserInteraction(): boolean {
    return true;
  }
}