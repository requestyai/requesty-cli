import Joi from 'joi';
import validator from 'validator';
import { ErrorHandler } from './error-handler';

/**
 * Comprehensive input validation utility
 * Provides sanitization and validation for all user inputs
 */
export class InputValidator {
  
  // Validation schemas
  private static readonly promptSchema = Joi.string()
    .min(1)
    .max(10000)
    .pattern(/^[\w\s\.\!\?\-\,\:\;\(\)\[\]\{\}\"\'\/\\@#$%^&*+=<>|~`]+$/)
    .required();

  private static readonly apiKeySchema = Joi.string()
    .min(20)
    .max(256)
    .pattern(/^[a-zA-Z0-9\-_.]+$/)
    .required();

  private static readonly modelNameSchema = Joi.string()
    .min(1)
    .max(100)
    .pattern(/^[a-zA-Z0-9\-_.\/]+$/)
    .required();

  private static readonly urlSchema = Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required();

  private static readonly filePathSchema = Joi.string()
    .min(1)
    .max(500)
    .required();

  /**
   * Validate and sanitize user prompts
   * @param prompt - User prompt to validate
   * @returns Validated and sanitized prompt
   */
  static validatePrompt(prompt: string): string {
    try {
      // Remove any potentially dangerous characters
      const sanitized = this.sanitizeInput(prompt);
      
      // Validate against schema
      const { error, value } = this.promptSchema.validate(sanitized);
      if (error) {
        ErrorHandler.handleValidationError(error, 'prompt', prompt);
      }

      // Additional security checks
      if (this.containsSuspiciousPatterns(value)) {
        throw new Error('Prompt contains potentially malicious content');
      }

      return value;
    } catch (error) {
      ErrorHandler.handleValidationError(error, 'prompt', prompt);
    }
  }

  /**
   * Validate API keys
   * @param apiKey - API key to validate
   * @returns Validated API key
   */
  static validateApiKey(apiKey: string): string {
    try {
      const { error, value } = this.apiKeySchema.validate(apiKey);
      if (error) {
        ErrorHandler.handleValidationError(error, 'apiKey', '[REDACTED]');
      }

      // Check for common patterns that indicate fake or test keys
      if (this.isTestApiKey(value)) {
        throw new Error('Test or placeholder API key detected');
      }

      return value;
    } catch (error) {
      ErrorHandler.handleValidationError(error, 'apiKey', '[REDACTED]');
    }
  }

  /**
   * Validate model names
   * @param modelName - Model name to validate
   * @returns Validated model name
   */
  static validateModelName(modelName: string): string {
    try {
      const { error, value } = this.modelNameSchema.validate(modelName);
      if (error) {
        ErrorHandler.handleValidationError(error, 'modelName', modelName);
      }

      return value;
    } catch (error) {
      ErrorHandler.handleValidationError(error, 'modelName', modelName);
    }
  }

  /**
   * Validate URLs
   * @param url - URL to validate
   * @returns Validated URL
   */
  static validateUrl(url: string): string {
    try {
      const { error, value } = this.urlSchema.validate(url);
      if (error) {
        ErrorHandler.handleValidationError(error, 'url', url);
      }

      // Additional security checks
      if (this.isLocalhost(value) && !this.isAllowedLocalhost(value)) {
        throw new Error('Localhost URLs are not allowed');
      }

      return value;
    } catch (error) {
      ErrorHandler.handleValidationError(error, 'url', url);
    }
  }

  /**
   * Validate file paths
   * @param filePath - File path to validate
   * @returns Validated file path
   */
  static validateFilePath(filePath: string): string {
    try {
      const { error, value } = this.filePathSchema.validate(filePath);
      if (error) {
        ErrorHandler.handleValidationError(error, 'filePath', filePath);
      }

      // Security checks for path traversal
      if (this.containsPathTraversal(value)) {
        throw new Error('Path traversal detected in file path');
      }

      // Check for suspicious file extensions
      if (this.hasSuspiciousExtension(value)) {
        throw new Error('Suspicious file extension detected');
      }

      return value;
    } catch (error) {
      ErrorHandler.handleValidationError(error, 'filePath', filePath);
    }
  }

  /**
   * Validate email addresses
   * @param email - Email to validate
   * @returns Validated email
   */
  static validateEmail(email: string): string {
    try {
      if (!validator.isEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Normalize email
      const normalized = validator.normalizeEmail(email);
      if (!normalized) {
        throw new Error('Email normalization failed');
      }

      return normalized;
    } catch (error) {
      ErrorHandler.handleValidationError(error, 'email', email);
    }
  }

  /**
   * Validate numeric inputs
   * @param value - Numeric value to validate
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @returns Validated number
   */
  static validateNumber(value: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
    try {
      const num = Number(value);
      
      if (isNaN(num) || !isFinite(num)) {
        throw new Error('Invalid number format');
      }

      if (num < min || num > max) {
        throw new Error(`Number must be between ${min} and ${max}`);
      }

      return num;
    } catch (error) {
      ErrorHandler.handleValidationError(error, 'number', value);
    }
  }

  /**
   * Sanitize input by removing potentially dangerous characters
   * @param input - Input to sanitize
   * @returns Sanitized input
   */
  private static sanitizeInput(input: string): string {
    return input
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Check if input contains suspicious patterns
   * @param input - Input to check
   * @returns True if suspicious patterns found
   */
  private static containsSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
      /url\s*\(/gi,
      /import\s*\(/gi,
      /require\s*\(/gi
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Check if API key is a test or placeholder key
   * @param apiKey - API key to check
   * @returns True if test key
   */
  private static isTestApiKey(apiKey: string): boolean {
    const testPatterns = [
      /^test[_-]?/i,
      /^demo[_-]?/i,
      /^sample[_-]?/i,
      /^placeholder/i,
      /^your[_-]?api[_-]?key/i,
      /^sk-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // Common test pattern
      /^[0-9a-f]{32}$/i // Simple hex test pattern
    ];

    return testPatterns.some(pattern => pattern.test(apiKey));
  }

  /**
   * Check if URL is localhost
   * @param url - URL to check
   * @returns True if localhost
   */
  private static isLocalhost(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.hostname === 'localhost' || 
             parsed.hostname === '127.0.0.1' ||
             parsed.hostname.endsWith('.local');
    } catch {
      return false;
    }
  }

  /**
   * Check if localhost URL is allowed
   * @param url - URL to check
   * @returns True if allowed
   */
  private static isAllowedLocalhost(url: string): boolean {
    const allowedPorts = [3000, 8000, 8080, 5000]; // Common development ports
    try {
      const parsed = new URL(url);
      const port = parseInt(parsed.port) || (parsed.protocol === 'https:' ? 443 : 80);
      return allowedPorts.includes(port);
    } catch {
      return false;
    }
  }

  /**
   * Check if path contains path traversal attempts
   * @param path - Path to check
   * @returns True if path traversal detected
   */
  private static containsPathTraversal(path: string): boolean {
    const traversalPatterns = [
      /\.\./,
      /\~\//,
      /\\\.\\./,
      /%2e%2e/i,
      /%2f/i,
      /%5c/i
    ];

    return traversalPatterns.some(pattern => pattern.test(path));
  }

  /**
   * Check if file has suspicious extension
   * @param filePath - File path to check
   * @returns True if suspicious extension
   */
  private static hasSuspiciousExtension(filePath: string): boolean {
    const suspiciousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
      '.vbs', '.js', '.jar', '.php', '.asp', '.aspx',
      '.jsp', '.py', '.rb', '.pl', '.sh', '.bash'
    ];

    const extension = filePath.toLowerCase().split('.').pop();
    return suspiciousExtensions.includes(`.${extension}`);
  }

  /**
   * Create a validation result object
   * @param isValid - Whether validation passed
   * @param value - Validated value
   * @param error - Error message if validation failed
   * @returns Validation result
   */
  static createValidationResult(isValid: boolean, value?: any, error?: string): ValidationResult {
    return {
      isValid,
      value,
      error
    };
  }

  /**
   * Validate multiple inputs at once
   * @param inputs - Object containing inputs to validate
   * @param validators - Object containing validation functions
   * @returns Object containing validation results
   */
  static validateMultiple(
    inputs: Record<string, any>,
    validators: Record<string, (value: any) => any>
  ): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};

    for (const [key, value] of Object.entries(inputs)) {
      const validator = validators[key];
      if (!validator) {
        results[key] = this.createValidationResult(false, undefined, `No validator found for ${key}`);
        continue;
      }

      try {
        const validatedValue = validator(value);
        results[key] = this.createValidationResult(true, validatedValue);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Validation failed';
        results[key] = this.createValidationResult(false, undefined, message);
      }
    }

    return results;
  }
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  value?: any;
  error?: string;
}