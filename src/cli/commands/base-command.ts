import { PerformanceMonitor } from '../../utils/performance-monitor';
import { ErrorHandler } from '../../utils/error-handler';
import { InputValidator } from '../../utils/input-validator';

/**
 * Base command class that all CLI commands should extend
 * Provides common functionality and enforces consistent patterns
 */
export abstract class BaseCommand {
  protected commandName: string;
  protected description: string;

  constructor(commandName: string, description: string) {
    this.commandName = commandName;
    this.description = description;
  }

  /**
   * Execute the command with performance monitoring and error handling
   * @param args - Command arguments
   * @returns Promise that resolves when command completes
   */
  async execute(args: any[] = []): Promise<void> {
    const operationId = `command-${this.commandName}-${Date.now()}`;
    
    try {
      const { result } = await PerformanceMonitor.measureAsync(
        () => this.run(args),
        operationId
      );
      
      await this.onSuccess(result);
    } catch (error) {
      await this.onError(error);
      ErrorHandler.handleApiError(error, `Command execution: ${this.commandName}`);
    }
  }

  /**
   * Abstract method that subclasses must implement
   * Contains the main command logic
   * @param args - Command arguments
   * @returns Promise that resolves with command result
   */
  protected abstract run(args: any[]): Promise<any>;

  /**
   * Validate command arguments
   * @param args - Arguments to validate
   * @returns Validated arguments
   */
  protected validateArgs(args: any[]): any[] {
    // Default implementation - subclasses can override
    return args;
  }

  /**
   * Display help information for the command
   */
  displayHelp(): void {
    console.log(`\n${this.commandName}: ${this.description}`);
    console.log(`Usage: requesty ${this.commandName} [options]`);
    this.displaySpecificHelp();
  }

  /**
   * Display command-specific help (to be overridden by subclasses)
   */
  protected displaySpecificHelp(): void {
    // Default implementation - subclasses can override
  }

  /**
   * Handle successful command execution
   * @param result - Command result
   */
  protected async onSuccess(result: any): Promise<void> {
    // Default implementation - subclasses can override
  }

  /**
   * Handle command execution errors
   * @param error - Error that occurred
   */
  protected async onError(error: unknown): Promise<void> {
    // Default implementation - subclasses can override
    console.error(`Error in command ${this.commandName}:`, error);
  }

  /**
   * Get command metadata
   * @returns Command metadata
   */
  getMetadata(): CommandMetadata {
    return {
      name: this.commandName,
      description: this.description,
      category: this.getCategory(),
      requiresAuth: this.requiresAuthentication(),
      requiresInteraction: this.requiresUserInteraction()
    };
  }

  /**
   * Get command category (to be overridden by subclasses)
   * @returns Command category
   */
  protected getCategory(): string {
    return 'general';
  }

  /**
   * Check if command requires authentication (to be overridden by subclasses)
   * @returns True if authentication required
   */
  protected requiresAuthentication(): boolean {
    return true;
  }

  /**
   * Check if command requires user interaction (to be overridden by subclasses)
   * @returns True if user interaction required
   */
  protected requiresUserInteraction(): boolean {
    return true;
  }

  /**
   * Validate string input
   * @param input - Input to validate
   * @param fieldName - Name of the field for error reporting
   * @returns Validated string
   */
  protected validateString(input: string, fieldName: string): string {
    if (!input || typeof input !== 'string') {
      throw new Error(`${fieldName} must be a non-empty string`);
    }
    return input.trim();
  }

  /**
   * Validate numeric input
   * @param input - Input to validate
   * @param fieldName - Name of the field for error reporting
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @returns Validated number
   */
  protected validateNumber(input: any, fieldName: string, min = 0, max = Number.MAX_SAFE_INTEGER): number {
    return InputValidator.validateNumber(input, min, max);
  }

  /**
   * Validate array input
   * @param input - Input to validate
   * @param fieldName - Name of the field for error reporting
   * @param minLength - Minimum array length
   * @param maxLength - Maximum array length
   * @returns Validated array
   */
  protected validateArray(input: any, fieldName: string, minLength = 0, maxLength = 1000): any[] {
    if (!Array.isArray(input)) {
      throw new Error(`${fieldName} must be an array`);
    }

    if (input.length < minLength || input.length > maxLength) {
      throw new Error(`${fieldName} length must be between ${minLength} and ${maxLength}`);
    }

    return input;
  }

  /**
   * Create standardized command result
   * @param success - Whether command succeeded
   * @param data - Result data
   * @param message - Result message
   * @returns Command result
   */
  protected createResult(success: boolean, data?: any, message?: string): CommandResult {
    return {
      success,
      data,
      message,
      timestamp: new Date().toISOString(),
      command: this.commandName
    };
  }

  /**
   * Log command execution details
   * @param message - Message to log
   * @param level - Log level
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.commandName}] ${message}`;
    
    switch (level) {
      case 'info':
        console.log(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        break;
    }
  }
}

/**
 * Command metadata interface
 */
export interface CommandMetadata {
  name: string;
  description: string;
  category: string;
  requiresAuth: boolean;
  requiresInteraction: boolean;
}

/**
 * Command result interface
 */
export interface CommandResult {
  success: boolean;
  data?: any;
  message?: string;
  timestamp: string;
  command: string;
}