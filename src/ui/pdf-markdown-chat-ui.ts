import readline from 'readline';
import chalk from 'chalk';
import { PDFMarkdownChatClient } from '../core/pdf-markdown-chat';
import { CLIConfig } from '../core/types';

export class PDFMarkdownChatUI {
  private rl: readline.Interface;
  private client: PDFMarkdownChatClient;

  constructor(config: CLIConfig) {
    this.client = new PDFMarkdownChatClient(config);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async startPDFChat(pdfPath: string, model?: string): Promise<void> {
    try {
      // Display welcome message
      this.client.displayWelcome();

      // Initialize PDF chat
      await this.client.initializePDFChat(pdfPath, model);

      // Display session info
      this.client.displaySessionInfo();

      // Start interactive loop
      await this.interactiveLoop();

    } catch (error) {
      this.client.displayError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.rl.close();
    }
  }

  private async interactiveLoop(): Promise<void> {
    return new Promise((resolve) => {
      const askQuestion = () => {
        this.rl.question(chalk.yellow('\n💬 You: '), async (input) => {
          const trimmedInput = input.trim();

          // Check for exit commands
          if (trimmedInput.toLowerCase() === 'exit' || trimmedInput.toLowerCase() === 'quit') {
            this.client.displayGoodbye();
            resolve();
            return;
          }

          // Check for empty input
          if (!trimmedInput) {
            console.log(chalk.gray('Please enter a message or type "exit" to quit.'));
            askQuestion();
            return;
          }

          // Check for help command
          if (trimmedInput.toLowerCase() === 'help') {
            this.client.displayHelp();
            askQuestion();
            return;
          }

          // Check for session info command
          if (trimmedInput.toLowerCase() === 'info') {
            this.client.displaySessionInfo();
            askQuestion();
            return;
          }

          try {
            // Send message to PDF chat
            await this.client.sendMessage(trimmedInput);
            askQuestion();
          } catch (error) {
            this.client.displayError(error instanceof Error ? error.message : 'Unknown error');
            askQuestion();
          }
        });
      };

      askQuestion();
    });
  }

  close(): void {
    this.rl.close();
  }
}