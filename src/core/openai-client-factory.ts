import { OpenAI } from 'openai';
import { CLIConfig } from './types';

/**
 * Factory class for creating OpenAI client instances with consistent configuration
 * Eliminates code duplication across RequestyAPI, StreamingClient, and SecureApiClient
 */
export class OpenAIClientFactory {
  private static readonly DEFAULT_TIMEOUT = 30000;
  private static readonly DEFAULT_HEADERS = {
    'HTTP-Referer': 'https://github.com/requestyai/requesty-cli',
    'X-Title': 'requesty-cli',
    'User-Agent': 'requesty-cli/2.0.0'
  };

  /**
   * Create a new OpenAI client instance with standardized configuration
   * @param config - Configuration object containing API settings
   * @returns Configured OpenAI client instance
   */
  static create(config: CLIConfig): OpenAI {
    return new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey || '<REQUESTY_API_KEY>',
      timeout: config.timeout || this.DEFAULT_TIMEOUT,
      defaultHeaders: this.DEFAULT_HEADERS,
    });
  }

  /**
   * Create a secure OpenAI client instance with enhanced headers
   * @param config - Configuration object containing API settings
   * @param additionalHeaders - Additional security headers
   * @returns Configured OpenAI client instance with security headers
   */
  static createSecure(config: CLIConfig, additionalHeaders: Record<string, string> = {}): OpenAI {
    const headers = {
      ...this.DEFAULT_HEADERS,
      ...additionalHeaders,
      'User-Agent': 'requesty-cli/2.0.0-secure'
    };

    return new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey || '<REQUESTY_API_KEY>',
      timeout: config.timeout || this.DEFAULT_TIMEOUT,
      defaultHeaders: headers,
    });
  }
}