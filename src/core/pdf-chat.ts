import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { CLIConfig } from './types';

export interface PDFChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface PDFChatSession {
  pdfPath: string;
  pdfFilename: string;
  messages: PDFChatMessage[];
  model: string;
}

export class PDFChatClient {
  private config: CLIConfig;
  private openai: OpenAI;
  private session: PDFChatSession | null = null;

  constructor(config: CLIConfig) {
    this.config = config;
    this.openai = new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey || process.env.REQUESTY_API_KEY,
      timeout: config.timeout,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/requestyai/requesty-cli',
        'X-Title': 'requesty-cli',
      },
    });
  }

  async initializePDFChat(pdfPath: string, model: string = 'gpt-4o'): Promise<void> {
    // Validate PDF file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    // Check if file is a PDF
    if (!pdfPath.toLowerCase().endsWith('.pdf')) {
      throw new Error(`File must be a PDF: ${pdfPath}`);
    }

    // Read PDF file as base64
    const pdfData = fs.readFileSync(pdfPath);
    const base64Data = pdfData.toString('base64');
    const filename = path.basename(pdfPath);

    // Initialize session
    this.session = {
      pdfPath,
      pdfFilename: filename,
      messages: [],
      model
    };

    // Send initial message with PDF
    const initialMessage = {
      role: 'user' as const,
      content: [
        {
          type: 'file' as const,
          file: {
            filename: filename,
            file_data: `data:application/pdf;base64,${base64Data}`
          }
        },
        {
          type: 'text' as const,
          text: 'Please analyze this PDF document and provide a summary.'
        }
      ]
    };

    console.log(chalk.blue(`\n📄 Uploading PDF: ${filename}`));
    console.log(chalk.gray(`   Model: ${model}`));
    console.log(chalk.gray(`   Processing document...`));

    try {
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [initialMessage],
        temperature: this.config.temperature,
        stream: true,
      });

      let fullResponse = '';
      console.log(chalk.green(`\n🤖 Assistant:`));
      
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          process.stdout.write(content);
          fullResponse += content;
        }
      }

      console.log('\n');

      // Store the conversation
      this.session.messages.push({
        role: 'user',
        content: 'Please analyze this PDF document and provide a summary.',
        timestamp: new Date()
      });

      this.session.messages.push({
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date()
      });

    } catch (error) {
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.session) {
      throw new Error('PDF chat session not initialized');
    }

    // Add user message to session
    this.session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Build conversation history for API
    const conversationHistory = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'file' as const,
            file: {
              filename: this.session.pdfFilename,
              file_data: `data:application/pdf;base64,${fs.readFileSync(this.session.pdfPath).toString('base64')}`
            }
          },
          {
            type: 'text' as const,
            text: 'Please analyze this PDF document and provide a summary.'
          }
        ]
      },
      ...this.session.messages.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    console.log(chalk.green(`\n🤖 Assistant:`));

    try {
      const response = await this.openai.chat.completions.create({
        model: this.session.model,
        messages: conversationHistory,
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
    console.log(chalk.bold.cyan('\n🔥 Requesty PDF Chat'));
    console.log(chalk.gray('Chat with your PDF documents using AI'));
    console.log(chalk.gray('Type "exit" or "quit" to end the session\n'));
  }

  displaySessionInfo(): void {
    if (!this.session) return;
    
    console.log(chalk.blue(`📄 Document: ${this.session.pdfFilename}`));
    console.log(chalk.blue(`🤖 Model: ${this.session.model}`));
    console.log(chalk.blue(`💬 Messages: ${this.session.messages.length}`));
    console.log(chalk.gray('─'.repeat(50)));
  }

  displayError(error: string): void {
    console.error(chalk.red(`❌ Error: ${error}`));
  }

  displayGoodbye(): void {
    console.log(chalk.green('\n👋 Thanks for using Requesty PDF Chat!'));
    if (this.session) {
      console.log(chalk.gray(`📊 Session summary: ${this.session.messages.length} messages exchanged`));
    }
  }
}