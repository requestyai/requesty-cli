/**
 * Centralized error handling utility to eliminate duplicate error handling patterns
 * Used across 13+ files in the codebase for consistent error processing
 */
export class ErrorHandler {
  /**
   * Handle API-related errors with consistent formatting
   * @param error - The error object or message
   * @param context - Context where the error occurred
   * @returns Never returns, always throws
   */
  static handleApiError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Log the error for debugging
    console.error(`[ERROR] ${context}: ${message}`);
    
    throw new Error(`${context}: ${message}`);
  }

  /**
   * Handle security-related errors with enhanced logging
   * @param error - The error object or message
   * @param context - Security context where the error occurred
   * @param sensitive - Whether the error contains sensitive information
   * @returns Never returns, always throws
   */
  static handleSecurityError(error: unknown, context: string, sensitive = false): never {
    const message = error instanceof Error ? error.message : 'Security error occurred';
    const sanitizedMessage = sensitive ? 'Sensitive operation failed' : message;
    
    // Only log in debug mode to avoid spam
    if (process.env.DEBUG) {
      console.error(`[SECURITY] ${context}: ${sanitizedMessage}`);
    }
    
    throw new Error(`Security error in ${context}: ${sanitizedMessage}`);
  }

  /**
   * Handle validation errors with detailed feedback
   * @param error - The validation error
   * @param field - The field that failed validation
   * @param value - The value that failed validation (will be sanitized)
   * @returns Never returns, always throws
   */
  static handleValidationError(error: unknown, field: string, value?: any): never {
    const message = error instanceof Error ? error.message : 'Validation failed';
    const sanitizedValue = typeof value === 'string' ? value.substring(0, 50) : '[complex value]';
    
    throw new Error(`Validation error for ${field}: ${message} (value: ${sanitizedValue})`);
  }

  /**
   * Handle file system errors with path information
   * @param error - The file system error
   * @param operation - The operation that failed
   * @param path - The file path (will be sanitized)
   * @returns Never returns, always throws
   */
  static handleFileError(error: unknown, operation: string, path: string): never {
    const message = error instanceof Error ? error.message : 'File operation failed';
    const sanitizedPath = path.replace(/([^/\\]+)$/, '[filename]'); // Hide filename but keep directory
    
    throw new Error(`File ${operation} failed at ${sanitizedPath}: ${message}`);
  }

  /**
   * Handle streaming errors with connection context
   * @param error - The streaming error
   * @param streamId - The stream identifier
   * @param stage - The stage where the error occurred
   * @returns Never returns, always throws
   */
  static handleStreamingError(error: unknown, streamId: string, stage: string): never {
    const message = error instanceof Error ? error.message : 'Streaming error';
    
    throw new Error(`Streaming error in ${stage} for stream ${streamId}: ${message}`);
  }

  /**
   * Wrap async operations with consistent error handling
   * @param operation - The async operation to wrap
   * @param context - Context for error reporting
   * @returns Promise that resolves with operation result or rejects with formatted error
   */
  static async wrapAsync<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleApiError(error, context);
    }
  }

  /**
   * Wrap sync operations with consistent error handling
   * @param operation - The sync operation to wrap
   * @param context - Context for error reporting
   * @returns Operation result or throws formatted error
   */
  static wrapSync<T>(operation: () => T, context: string): T {
    try {
      return operation();
    } catch (error) {
      this.handleApiError(error, context);
    }
  }
}