/**
 * @fileoverview Menu handling logic for CLI interface
 * @author Requesty CLI Team
 * @license MIT
 * @copyright 2024 Requesty CLI Contributors
 */

import { InteractiveUI } from '../../ui/interactive-ui';

/**
 * Menu actions available in the CLI
 */
export type MenuAction = 'quick' | 'select' | 'chat' | 'pdf-chat' | 'security' | 'exit';

/**
 * Handles all menu-related operations for the CLI
 * Extracted from the monolithic CLI class for better separation of concerns
 */
export class MenuHandler {
  private ui: InteractiveUI;

  /**
   * Creates a new menu handler
   * @param ui - Interactive UI instance
   */
  constructor(ui: InteractiveUI) {
    this.ui = ui;
  }

  /**
   * Show the main menu and get user selection
   * @returns Promise resolving to the selected menu action
   */
  async showMainMenu(): Promise<MenuAction> {
    return await this.ui.showMainMenu();
  }

  /**
   * Show a confirmation dialog
   * @param message - Message to display
   * @returns Promise resolving to user's confirmation
   */
  async showConfirmation(message: string): Promise<boolean> {
    // This would use inquirer to show a confirmation dialog
    // For now, return true as a placeholder
    console.log(`❓ ${message}`);
    return true;
  }

  /**
   * Show an error message
   * @param message - Error message to display
   */
  showError(message: string): void {
    console.error(`❌ ${message}`);
  }

  /**
   * Show a success message
   * @param message - Success message to display
   */
  showSuccess(message: string): void {
    console.log(`✅ ${message}`);
  }

  /**
   * Show an info message
   * @param message - Info message to display
   */
  showInfo(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  /**
   * Show a warning message
   * @param message - Warning message to display
   */
  showWarning(message: string): void {
    console.warn(`⚠️  ${message}`);
  }

  /**
   * Clear the console
   */
  clearConsole(): void {
    console.clear();
  }

  /**
   * Show the application header
   */
  showHeader(): void {
    console.log('\n🚀 Requesty CLI - Interactive AI Model Testing');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Show help information
   * @param command - Specific command to show help for (optional)
   */
  showHelp(command?: string): void {
    if (command) {
      console.log(`\n📖 Help for command: ${command}`);
      // Show command-specific help
    } else {
      console.log('\n📖 Requesty CLI Help');
      console.log('Available commands:');
      console.log('  🚀 Quick Start - Test 5 default models');
      console.log('  🎯 Select Models - Choose specific models to test');
      console.log('  📄 Chat with PDF - Upload and chat with PDF documents');
      console.log('  🔒 Security Status - View security configuration');
      console.log('  ❌ Exit - Exit the application');
    }
  }

  /**
   * Show a loading indicator
   * @param message - Loading message
   */
  showLoading(message: string): void {
    console.log(`⏳ ${message}`);
  }

  /**
   * Show progress information
   * @param current - Current progress
   * @param total - Total items
   * @param message - Progress message
   */
  showProgress(current: number, total: number, message: string): void {
    const percentage = Math.round((current / total) * 100);
    console.log(`📊 ${message} (${current}/${total} - ${percentage}%)`);
  }
}
