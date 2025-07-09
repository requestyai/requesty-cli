import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { CLIConfig } from '../../core/types';
import { PDFContent, PDFChatSession, ChatResponse, PDFChatConfig } from '../types/chat-types';
import { ConversationManager } from './conversation-manager';

export class PDFChatClient {
  private openai: OpenAI;
  private config: CLIConfig;
  private chatConfig: PDFChatConfig;
  private session: PDFChatSession | null = null;
  private conversationManager: ConversationManager | null = null;

  constructor(config: CLIConfig, chatConfig: PDFChatConfig) {
    this.config = config;
    this.chatConfig = chatConfig;
    this.openai = new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey || process.env.REQUESTY_API_KEY || '<REQUESTY_API_KEY>',
      timeout: config.timeout,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/requestyai/requesty-cli',
        'X-Title': 'requesty-cli',
      },
    });
  }

  async initializeSession(pdfContent: PDFContent, pdfPath: string): Promise<void> {
    this.session = {
      id: uuidv4(),
      pdfPath,
      pdfContent,
      messages: [],
      model: this.chatConfig.model,
      created: new Date(),
      lastActivity: new Date(),
      status: 'initializing'
    };

    this.conversationManager = new ConversationManager(this.session);
    
    // Initialize with system prompt
    this.conversationManager.initializeConversation();
    
    this.session.status = 'ready';
  }

  async askFirstQuestion(question: string): Promise<ChatResponse> {
    if (!this.session || !this.conversationManager) {
      throw new Error('Session not initialized');
    }

    this.session.status = 'processing';
    
    try {
      // Add user question with PDF context
      this.conversationManager.addUserQuestionWithPDF(question);
      
      // Get response from AI
      const response = await this.getAIResponse();
      
      // Add assistant response to conversation
      this.conversationManager.addAssistantResponse(response.message || '');
      
      this.session.status = 'ready';
      return response;
      
    } catch (error) {
      this.session.status = 'error';
      throw error;
    }
  }

  async askFollowUpQuestion(question: string): Promise<ChatResponse> {
    if (!this.session || !this.conversationManager) {
      throw new Error('Session not initialized');
    }

    this.session.status = 'processing';
    
    try {
      // Add user question (without PDF context since it's already in conversation)
      this.conversationManager.addUserQuestion(question);
      
      // Get response from AI
      const response = await this.getAIResponse();
      
      // Add assistant response to conversation
      this.conversationManager.addAssistantResponse(response.message || '');
      
      this.session.status = 'ready';
      return response;
      
    } catch (error) {
      this.session.status = 'error';
      throw error;
    }
  }

  private async getAIResponse(): Promise<ChatResponse> {
    if (!this.conversationManager) {
      throw new Error('Conversation manager not initialized');
    }

    const startTime = Date.now();
    
    try {
      const messages = this.conversationManager.getMessagesForAPI();
      
      const response = await this.openai.chat.completions.create({
        model: this.chatConfig.model,
        messages: messages as any,
        temperature: this.chatConfig.temperature,
        max_tokens: this.chatConfig.maxTokens,
        stream: true,
      });

      let fullResponse = '';
      
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          process.stdout.write(content);
          fullResponse += content;
        }
      }

      console.log('\n');
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        message: fullResponse,
        responseTime
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      };
    }
  }

  getSession(): PDFChatSession | null {
    return this.session;
  }

  getConversationSummary() {
    return this.conversationManager?.getConversationSummary() || null;
  }

  isFirstQuestion(): boolean {
    if (!this.conversationManager) return true;
    
    const messages = this.conversationManager.getMessagesForAPI();
    // System prompt + user question with PDF = first question
    return messages.length <= 1;
  }

  hasActiveSession(): boolean {
    return this.session !== null && this.session.status === 'ready';
  }
}