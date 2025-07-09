import chalk from 'chalk';

/**
 * Centralized console formatting utilities for consistent styling
 */
export class ConsoleFormatter {
  // Text styles
  static header(text: string): string {
    return chalk.bold.cyan(text);
  }

  static subheader(text: string): string {
    return chalk.blue(text);
  }

  static success(text: string): string {
    return chalk.green(text);
  }

  static error(text: string): string {
    return chalk.red(text);
  }

  static warning(text: string): string {
    return chalk.yellow(text);
  }

  static info(text: string): string {
    return chalk.gray(text);
  }

  static assistant(text: string): string {
    return chalk.green(text);
  }

  static user(text: string): string {
    return chalk.yellow(text);
  }

  static separator(length: number = 50): string {
    return chalk.gray('─'.repeat(length));
  }

  static printWelcome(): void {
    console.log(this.header('\n🔥 Requesty PDF Chat'));
    console.log(this.info('Chat with your PDF documents using AI'));
    console.log(this.info('Type "exit" or "quit" to end the session\n'));
  }

  static printSessionInfo(filename: string, model: string, messageCount: number): void {
    console.log(this.subheader(`📄 Document: ${filename}`));
    console.log(this.subheader(`🤖 Model: ${model}`));
    console.log(this.subheader(`💬 Messages: ${messageCount}`));
    console.log(this.separator());
  }

  static printError(error: string): void {
    console.error(this.error(`❌ Error: ${error}`));
  }

  static printGoodbye(messageCount: number): void {
    console.log(this.success('\n👋 Thanks for using Requesty PDF Chat!'));
    console.log(this.info(`📊 Session summary: ${messageCount} messages exchanged`));
  }

  static printHelp(): void {
    console.log(this.header('\n📖 Available Commands:'));
    console.log(this.info('• Type any message to chat with the PDF'));
    console.log(this.info('• "info" - Display session information'));
    console.log(this.info('• "help" - Show this help message'));
    console.log(this.info('• "exit" or "quit" - End the session'));
    console.log(this.separator());
  }

  static printProcessing(filename: string, model: string): void {
    console.log(this.subheader(`\n📄 Uploading PDF: ${filename}`));
    console.log(this.info(`   Model: ${model}`));
    console.log(this.info(`   Processing document...`));
  }

  static printAssistantPrefix(): void {
    console.log(this.assistant(`\n🤖 Assistant:`));
  }
}