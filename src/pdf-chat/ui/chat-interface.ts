import readline from 'readline';
import chalk from 'chalk';
import { PDFChatClient } from '../core/pdf-chat-client';
import { PDFConverter } from '../converters/pdf-converter';
import { CLIConfig } from '../../core/types';
import { PDFChatConfig } from '../types/chat-types';
import { FileValidator } from '../../utils/file-validator';
import { ConsoleFormatter } from '../../ui/console-formatter';

export class PDFChatInterface {
  private rl: readline.Interface;
  private client: PDFChatClient;
  private isFirstQuestion: boolean = true;

  constructor(config: CLIConfig, chatConfig: PDFChatConfig) {
    this.client = new PDFChatClient(config, chatConfig);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async start(pdfPath: string): Promise<void> {
    try {
      // Display welcome
      this.displayWelcome();

      // Validate and convert PDF
      await this.initializePDF(pdfPath);

      // Start chat loop
      await this.chatLoop();

    } catch (error) {
      ConsoleFormatter.printError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.client.endSession();
      this.rl.close();
    }
  }

  private async initializePDF(pdfPath: string): Promise<void> {
    // Validate PDF
    const validation = FileValidator.validatePDF(pdfPath);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    console.log(ConsoleFormatter.info('📄 Converting PDF to markdown...'));
    
    // Convert PDF
    const pdfContent = await PDFConverter.convertToMarkdown(pdfPath);
    
    console.log(ConsoleFormatter.success(`✅ Successfully processed PDF:`));
    console.log(ConsoleFormatter.info(`   📄 File: ${pdfContent.filename}`));
    console.log(ConsoleFormatter.info(`   📊 Pages: ${pdfContent.pages}`));
    console.log(ConsoleFormatter.info(`   📝 Words: ${pdfContent.wordCount.toLocaleString()}`));
    console.log(ConsoleFormatter.info(`   🔤 Characters: ${pdfContent.characterCount.toLocaleString()}`));

    // Initialize chat session
    await this.client.initializeSession(pdfContent, pdfPath);
    
    console.log(ConsoleFormatter.success('🚀 PDF chat session initialized!'));
    console.log(ConsoleFormatter.info('💡 Ask your first question about the document...\n'));
  }

  private async chatLoop(): Promise<void> {
    return new Promise((resolve) => {
      const askQuestion = () => {
        const promptText = this.isFirstQuestion 
          ? '🔍 Your first question about the PDF: '
          : '💬 Your follow-up question: ';
          
        this.rl.question(chalk.yellow(promptText), async (input) => {
          const trimmedInput = input.trim();

          // Handle special commands
          if (await this.handleSpecialCommand(trimmedInput, resolve)) {
            return;
          }

          // Handle empty input
          if (!trimmedInput) {
            console.log(ConsoleFormatter.info('Please enter a question or type "exit" to quit.'));
            askQuestion();
            return;
          }

          try {
            // Process the question
            await this.processQuestion(trimmedInput);
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

      default:
        return false;
    }
  }

  private async processQuestion(question: string): Promise<void> {
    console.log(ConsoleFormatter.assistant('\n🤖 Expert Analysis:'));
    
    try {
      let response;
      
      if (this.isFirstQuestion) {
        response = await this.client.askFirstQuestion(question);
        this.isFirstQuestion = false;
      } else {
        response = await this.client.askFollowUpQuestion(question);
      }

      if (!response.success) {
        throw new Error(response.error || 'Failed to get response');
      }

      console.log(ConsoleFormatter.info(`\n⏱️  Response time: ${response.responseTime}ms`));
      
      // Handle feedback if we have a request ID
      if (response.requestId) {
        await this.handleFeedback(response.requestId);
      }
      
    } catch (error) {
      throw new Error(`Failed to process question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

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

  private displayWelcome(): void {
    console.log(ConsoleFormatter.header('\n🔥 Requesty PDF Expert Chat'));
    console.log(ConsoleFormatter.info('Your AI-powered PDF research assistant'));
    console.log(ConsoleFormatter.info('Type "help" for commands, "exit" to quit\n'));
  }

  private displayHelp(): void {
    console.log(ConsoleFormatter.header('\n📖 Available Commands:'));
    console.log(ConsoleFormatter.info('• Ask any question about the PDF content'));
    console.log(ConsoleFormatter.info('• "info" - Show session information'));
    console.log(ConsoleFormatter.info('• "summary" - Show conversation summary'));
    console.log(ConsoleFormatter.info('• "help" - Show this help message'));
    console.log(ConsoleFormatter.info('• "exit" or "quit" - End the session'));
    console.log(ConsoleFormatter.separator());
  }

  private displaySessionInfo(): void {
    const session = this.client.getSession();
    if (!session) return;

    console.log(ConsoleFormatter.header('\n📊 Session Information:'));
    console.log(ConsoleFormatter.subheader(`📄 Document: ${session.pdfContent.filename}`));
    console.log(ConsoleFormatter.subheader(`📚 Pages: ${session.pdfContent.pages}`));
    console.log(ConsoleFormatter.subheader(`📝 Words: ${session.pdfContent.wordCount.toLocaleString()}`));
    console.log(ConsoleFormatter.subheader(`🤖 Model: ${session.model}`));
    console.log(ConsoleFormatter.subheader(`💬 Messages: ${session.messages.length}`));
    console.log(ConsoleFormatter.subheader(`🕒 Created: ${session.created.toLocaleString()}`));
    console.log(ConsoleFormatter.subheader(`📈 Status: ${session.status}`));
    console.log(ConsoleFormatter.separator());
  }

  private displayConversationSummary(): void {
    const summary = this.client.getConversationSummary();
    if (!summary) return;

    console.log(ConsoleFormatter.header('\n📋 Conversation Summary:'));
    console.log(ConsoleFormatter.subheader(`💬 Total Messages: ${summary.totalMessages}`));
    console.log(ConsoleFormatter.subheader(`❓ User Questions: ${summary.userQuestions}`));
    console.log(ConsoleFormatter.subheader(`🤖 AI Responses: ${summary.assistantResponses}`));
    console.log(ConsoleFormatter.subheader(`📊 Total Characters: ${summary.totalCharacters.toLocaleString()}`));
    console.log(ConsoleFormatter.subheader(`📄 PDF Included: ${summary.pdfIncluded ? 'Yes' : 'No'}`));
    console.log(ConsoleFormatter.separator());
  }

  private displayGoodbye(): void {
    const summary = this.client.getConversationSummary();
    const messageCount = summary ? summary.userQuestions : 0;
    
    console.log(ConsoleFormatter.success('\n👋 Thank you for using Requesty PDF Expert Chat!'));
    console.log(ConsoleFormatter.info(`📊 Session completed with ${messageCount} questions answered`));
  }

  close(): void {
    this.rl.close();
  }
}