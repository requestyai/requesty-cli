/**
 * @fileoverview Core chat client for regular conversations
 * @author Requesty CLI Team
 * @license MIT
 * @copyright 2024 Requesty CLI Contributors
 */

import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { CLIConfig } from '../../core/types';
import { ChatMessage, ChatSession, ChatResponse, ChatConfig, FeedbackResponse, ConversationSummary } from '../types/chat-types';
import { SessionManager } from '../../utils/session-manager';
import { OpenAIClientFactory } from '../../core/openai-client-factory';

export class ChatClient {
  private openai: OpenAI;
  private config: CLIConfig;
  private chatConfig: ChatConfig;
  private session: ChatSession | null = null;
  private sessionManager: SessionManager;

  constructor(config: CLIConfig, chatConfig: ChatConfig) {
    this.config = config;
    this.chatConfig = chatConfig;
    this.sessionManager = SessionManager.getInstance();
    this.openai = OpenAIClientFactory.create(config);
  }

  /**
   * Initialize a new chat session
   */
  async initializeSession(): Promise<void> {
    // Start a chat session with session manager
    this.sessionManager.startSession('chat');

    this.session = {
      id: uuidv4(),
      messages: [],
      model: this.chatConfig.model,
      created: new Date(),
      lastActivity: new Date(),
      status: 'initializing',
      totalTokens: 0,
      totalMessages: 0,
    };

    // Add system prompt if configured
    if (this.chatConfig.includeSystemPrompt && this.chatConfig.systemPrompt) {
      this.addMessage({
        role: 'system',
        content: this.chatConfig.systemPrompt,
        timestamp: new Date(),
        metadata: {
          type: 'system',
          messageLength: this.chatConfig.systemPrompt.length,
        }
      });
    }

    this.session.status = 'ready';
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(message: string): Promise<ChatResponse> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    this.session.status = 'processing';
    const startTime = Date.now();

    try {
      // Add user message
      this.addMessage({
        role: 'user',
        content: message,
        timestamp: new Date(),
        metadata: {
          type: 'user_message',
          messageLength: message.length,
        }
      });

      // Get messages for API
      const messages = this.getMessagesForAPI();

      // Prepare metadata for Requesty
      const metadata = this.sessionManager.getRequestyMetadata({
        model: this.chatConfig.model,
        message_count: messages.length,
        total_tokens: this.session.totalTokens,
        session_duration: Date.now() - this.session.created.getTime(),
        conversation_mode: 'regular_chat'
      });

      // Create request parameters
      const requestParams: any = {
        model: this.chatConfig.model,
        messages: messages as any,
        temperature: this.chatConfig.temperature || 0.7,
        max_tokens: this.chatConfig.maxTokens,
        stream: true,
      };

      // Add Requesty metadata
      if (metadata) {
        requestParams.requesty = metadata;
      }

      // Make API call
      const response = await this.openai.chat.completions.create(requestParams) as any;

      let fullResponse = '';
      let requestId: string | undefined;
      let tokensUsed = 0;

      // Process streaming response
      for await (const chunk of response) {
        // Capture request ID from the first chunk
        if (!requestId && chunk.id) {
          requestId = chunk.id;
        }

        // Extract token usage if available
        if (chunk.usage) {
          tokensUsed = chunk.usage.total_tokens || 0;
        }

        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          process.stdout.write(content);
          fullResponse += content;
        }
      }

      console.log('\n');

      // Add assistant response
      this.addMessage({
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        metadata: {
          type: 'assistant_response',
          messageLength: fullResponse.length,
          tokensUsed,
        }
      });

      // Update session stats
      this.session.totalTokens += tokensUsed;
      this.session.status = 'ready';

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        message: fullResponse,
        tokensUsed,
        responseTime,
        requestId
      };

    } catch (error) {
      this.session.status = 'error';
      const responseTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      };
    }
  }

  /**
   * Send feedback for a response
   */
  async sendFeedback(requestId: string, thumbs: 'up' | 'down'): Promise<FeedbackResponse> {
    try {
      const feedbackUrl = `https://api.requesty.ai/feedback/${requestId}`;
      const apiKey = this.config.apiKey || process.env.REQUESTY_API_KEY;

      if (!apiKey || apiKey === '<REQUESTY_API_KEY>') {
        throw new Error('API key not configured');
      }

      const response = await fetch(feedbackUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: { thumbs }
        })
      });

      if (!response.ok) {
        throw new Error(`Feedback API error: ${response.status} ${response.statusText}`);
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get the current session
   */
  getSession(): ChatSession | null {
    return this.session;
  }

  /**
   * Get conversation summary
   */
  getConversationSummary(): ConversationSummary | null {
    if (!this.session) return null;

    const userMessages = this.session.messages.filter(m => m.role === 'user').length;
    const assistantMessages = this.session.messages.filter(m => m.role === 'assistant').length;
    const totalCharacters = this.session.messages.reduce((sum, m) => sum + m.content.length, 0);

    return {
      totalMessages: this.session.messages.length,
      userMessages,
      assistantResponses: assistantMessages,
      totalCharacters,
      totalTokens: this.session.totalTokens,
      sessionDuration: Date.now() - this.session.created.getTime(),
      model: this.session.model,
    };
  }

  /**
   * End the chat session
   */
  endSession(): void {
    this.sessionManager.endSession();
    this.session = null;
  }

  /**
   * Private: Add a message to the session
   */
  private addMessage(message: ChatMessage): void {
    if (!this.session) return;

    this.session.messages.push(message);
    this.session.totalMessages++;
    this.session.lastActivity = new Date();
  }

  /**
   * Private: Get messages formatted for API
   */
  private getMessagesForAPI(): { role: string; content: string }[] {
    if (!this.session) return [];

    // Include conversation history if enabled
    if (this.chatConfig.conversationHistory) {
      return this.session.messages.map(m => ({
        role: m.role,
        content: m.content
      }));
    }

    // Otherwise, only include system prompt (if any) and latest user message
    const messages: { role: string; content: string }[] = [];

    // Add system prompt if exists
    const systemMessage = this.session.messages.find(m => m.role === 'system');
    if (systemMessage) {
      messages.push({
        role: systemMessage.role,
        content: systemMessage.content
      });
    }

    // Add latest user message
    const userMessages = this.session.messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const latestUserMessage = userMessages[userMessages.length - 1];
      messages.push({
        role: latestUserMessage.role,
        content: latestUserMessage.content
      });
    }

    return messages;
  }
}
