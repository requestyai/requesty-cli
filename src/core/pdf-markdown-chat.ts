import OpenAI from 'openai';
import { CLIConfig } from './types';
import { FileValidator } from '../utils/file-validator';
import { PDFToMarkdownConverter, PDFContent } from '../utils/pdf-to-markdown';
import { ConsoleFormatter } from '../ui/console-formatter';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface PDFChatSession {
  pdfPath: string;
  pdfContent: PDFContent;
  messages: ChatMessage[];
  model: string;
}

export class PDFMarkdownChatClient {
  private config: CLIConfig;
  private openai: OpenAI;
  private session: PDFChatSession | null = null;

  constructor(config: CLIConfig) {
    this.config = config;
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

  async initializePDFChat(pdfPath: string, model: string = 'openai/gpt-4o'): Promise<void> {
    // Validate PDF file
    const validation = FileValidator.validatePDF(pdfPath);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    ConsoleFormatter.printProcessing(pdfPath, model);
    console.log(ConsoleFormatter.info('📄 Converting PDF to markdown...'));

    try {
      // Convert PDF to markdown
      const pdfContent = await PDFToMarkdownConverter.convertPDFToMarkdown(pdfPath);
      
      console.log(ConsoleFormatter.success(`✅ Converted ${pdfContent.pages} pages to markdown`));
      console.log(ConsoleFormatter.info(`📝 Text length: ${pdfContent.text.length} characters`));

      // Initialize session
      this.session = {
        pdfPath,
        pdfContent,
        messages: [],
        model
      };

      // Send initial analysis request
      const initialPrompt = PDFToMarkdownConverter.formatForChat(
        pdfContent,
        'Please analyze this PDF document and provide a summary.'
      );

      await this.sendChatMessage(initialPrompt, true);

    } catch (error) {
      throw new Error(`Failed to initialize PDF chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.session) {
      throw new Error('PDF chat session not initialized');
    }

    const contextualMessage = PDFToMarkdownConverter.formatForChat(
      this.session.pdfContent,
      message
    );

    await this.sendChatMessage(contextualMessage, false);
  }

  private async sendChatMessage(content: string, isInitial: boolean = false): Promise<void> {
    if (!this.session) {
      throw new Error('PDF chat session not initialized');
    }

    // Add user message to session
    this.session.messages.push({
      role: 'user',
      content: isInitial ? 'Please analyze this PDF document and provide a summary.' : content,
      timestamp: new Date()
    });

    ConsoleFormatter.printAssistantPrefix();

    try {
      const response = await this.openai.chat.completions.create({
        model: this.session.model,
        messages: [
          {
            role: 'user',
            content: content
          }
        ],
        temperature: this.config.temperature,
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

      // Store assistant response
      this.session.messages.push({
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date()
      });

    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getSession(): PDFChatSession | null {
    return this.session;
  }

  displayWelcome(): void {
    ConsoleFormatter.printWelcome();
  }

  displaySessionInfo(): void {
    if (!this.session) return;
    
    console.log(ConsoleFormatter.subheader(`📄 Document: ${this.session.pdfContent.filename}`));
    console.log(ConsoleFormatter.subheader(`📊 Pages: ${this.session.pdfContent.pages}`));
    console.log(ConsoleFormatter.subheader(`📝 Characters: ${this.session.pdfContent.text.length.toLocaleString()}`));
    console.log(ConsoleFormatter.subheader(`🤖 Model: ${this.session.model}`));
    console.log(ConsoleFormatter.subheader(`💬 Messages: ${this.session.messages.length}`));
    console.log(ConsoleFormatter.separator());
  }

  displayError(error: string): void {
    ConsoleFormatter.printError(error);
  }

  displayGoodbye(): void {
    const messageCount = this.session ? this.session.messages.length : 0;
    ConsoleFormatter.printGoodbye(messageCount);
  }

  displayHelp(): void {
    ConsoleFormatter.printHelp();
  }
}