import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';

/**
 * Terminal UI utility for consistent terminal output
 * Provides formatted display methods for CLI applications
 */
export class TerminalUI {
  private theme = {
    primary: chalk.cyan,
    secondary: chalk.gray,
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow,
    info: chalk.blue,
    highlight: chalk.magenta
  };

  /**
   * Display a welcome message with ASCII art
   */
  displayWelcome(): void {
    console.log('\n' + gradient.pastel.multiline(figlet.textSync('Requesty CLI', { font: 'Standard' })));
    console.log(this.theme.secondary('  AI Model Testing Made Easy\n'));
  }

  /**
   * Display a header with styling
   * @param text - Header text
   */
  displayHeader(text: string): void {
    console.log('\n' + this.theme.primary('═'.repeat(text.length + 4)));
    console.log(this.theme.primary('  ' + text + '  '));
    console.log(this.theme.primary('═'.repeat(text.length + 4)) + '\n');
  }

  /**
   * Display info message
   * @param text - Info text
   */
  displayInfo(text: string): void {
    console.log(this.theme.info('ℹ ') + text);
  }

  /**
   * Display success message
   * @param text - Success text
   */
  displaySuccess(text: string): void {
    console.log(this.theme.success('✅ ') + text);
  }

  /**
   * Display error message
   * @param text - Error text
   */
  displayError(text: string): void {
    console.log(this.theme.error('❌ ') + text);
  }

  /**
   * Display warning message
   * @param text - Warning text
   */
  displayWarning(text: string): void {
    console.log(this.theme.warning('⚠️ ') + text);
  }

  /**
   * Display progress message
   * @param text - Progress text
   */
  displayProgress(text: string): void {
    console.log(this.theme.highlight('⏳ ') + text);
  }

  /**
   * Display a table of data
   * @param data - Array of objects to display
   */
  displayTable(data: any[]): void {
    if (data.length === 0) {
      this.displayInfo('No data to display');
      return;
    }

    const headers = Object.keys(data[0]);
    const columnWidths = headers.map(header => 
      Math.max(header.length, ...data.map(row => String(row[header] || '').length))
    );

    // Display header
    const headerRow = headers.map((header, i) => 
      header.padEnd(columnWidths[i])
    ).join(' │ ');
    console.log(this.theme.primary('┌' + '─'.repeat(headerRow.length + 2) + '┐'));
    console.log(this.theme.primary('│ ') + this.theme.highlight(headerRow) + this.theme.primary(' │'));
    console.log(this.theme.primary('├' + '─'.repeat(headerRow.length + 2) + '┤'));

    // Display data rows
    data.forEach(row => {
      const dataRow = headers.map((header, i) => 
        String(row[header] || '').padEnd(columnWidths[i])
      ).join(' │ ');
      console.log(this.theme.primary('│ ') + dataRow + this.theme.primary(' │'));
    });

    console.log(this.theme.primary('└' + '─'.repeat(headerRow.length + 2) + '┘'));
  }

  /**
   * Get prompt from user (placeholder - would use inquirer in real implementation)
   * @returns Promise resolving to user input
   */
  async getPrompt(): Promise<string> {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(this.theme.primary('Enter your prompt: '), (answer: string) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  /**
   * Get streaming preference from user
   * @returns Promise resolving to boolean
   */
  async getStreamingPreference(): Promise<boolean> {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(this.theme.primary('Use streaming? (y/n): '), (answer: string) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  /**
   * Select multiple models (placeholder)
   * @param choices - Array of model choices
   * @returns Promise resolving to selected models
   */
  async selectMultipleModels(choices: any[]): Promise<any[]> {
    // This would use inquirer in real implementation
    // For now, return first 3 choices
    return choices.slice(0, 3).map(choice => choice.value);
  }

  /**
   * Get theme colors
   * @returns Theme object
   */
  getTheme() {
    return this.theme;
  }
}