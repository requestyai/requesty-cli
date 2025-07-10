import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { CLIConfig } from '../../core/types';
import { PDFContent, PDFChatSession, ChatResponse, PDFChatConfig, FeedbackResponse } from '../types/chat-types';
import { ConversationManager } from './conversation-manager';
import { SessionManager } from '../../utils/session-manager';

export class PDFChatClient {
  private openai: OpenAI;
  private config: CLIConfig;
  private chatConfig: PDFChatConfig;
  private session: PDFChatSession | null = null;
  private conversationManager: ConversationManager | null = null;
  private sessionManager: SessionManager;

  constructor(config: CLIConfig, chatConfig: PDFChatConfig) {
    this.config = config;
    this.chatConfig = chatConfig;
    this.sessionManager = SessionManager.getInstance();
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
    // Start a PDF chat session with session manager
    this.sessionManager.startSession('pdf_chat');

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

      const metadata = this.sessionManager.getRequestyMetadata({
        pdf_filename: this.session?.pdfContent.filename,
        pdf_pages: this.session?.pdfContent.pages,
        pdf_word_count: this.session?.pdfContent.wordCount,
        question_length: messages[messages.length - 1]?.content?.length || 0,
        message_count: messages.length,
        is_first_question: this.isFirstQuestion()
      });

      const requestParams: any = {
        model: this.chatConfig.model,
        messages: messages as any,
        temperature: this.chatConfig.temperature,
        max_tokens: this.chatConfig.maxTokens,
        stream: true,
      };

      // Add Requesty metadata directly to request body (Test 5 approach that works!)
      if (metadata) {
        requestParams.requesty = metadata;
      }

      const response = await this.openai.chat.completions.create(requestParams) as any;

      let fullResponse = '';
      let requestId: string | undefined;

      for await (const chunk of response) {
        // Capture request ID from the first chunk
        if (!requestId && chunk.id) {
          requestId = chunk.id;
        }

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
        responseTime,
        requestId
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

  async sendFeedback(requestId: string, thumbs: 'up' | 'down'): Promise<FeedbackResponse> {
    try {
      const feedbackUrl = `http://localhost:30000/feedback/${requestId}`;
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

  getSession(): PDFChatSession | null {
    return this.session;
  }

  getConversationSummary() {
    return this.conversationManager?.getConversationSummary() || null;
  }

  isFirstQuestion(): boolean {
    if (!this.conversationManager) {return true;}

    const messages = this.conversationManager.getMessagesForAPI();
    // System prompt + user question with PDF = first question
    return messages.length <= 1;
  }

  hasActiveSession(): boolean {
    return this.session !== null && this.session.status === 'ready';
  }

  endSession(): void {
    this.sessionManager.endSession();
    this.session = null;
    this.conversationManager = null;
  }
}
