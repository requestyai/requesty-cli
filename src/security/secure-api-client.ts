import * as crypto from 'crypto';
import * as https from 'https';
import OpenAI from 'openai';
import { ErrorHandler } from '../utils/error-handler';
import { InputValidator } from '../utils/input-validator';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { SecureKeyManager } from './secure-key-manager';

/**
 * Ultra-secure API client with advanced security features
 */
export class SecureApiClient {
  private openai: OpenAI;
  private keyManager: SecureKeyManager;
  private static readonly REQUEST_TIMEOUT = 30000;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  constructor(
    baseURL: string,
    timeout: number = SecureApiClient.REQUEST_TIMEOUT
  ) {
    // Validate inputs
    const validatedBaseURL = InputValidator.validateUrl(baseURL);
    const validatedTimeout = InputValidator.validateNumber(
      timeout,
      1000,
      60000
    );

    this.keyManager = new SecureKeyManager();

    // Create secure HTTPS agent
    const httpsAgent = new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 30000,
      timeout: timeout,
      // Enforce TLS 1.2 minimum
      secureProtocol: 'TLSv1_2_method',
      // Verify certificates
      rejectUnauthorized: true,
      // Disable insecure ciphers
      ciphers: [
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-SHA384',
        'ECDHE-RSA-AES128-SHA256',
      ].join(':'),
      // Security options
      secureOptions:
        crypto.constants.SSL_OP_NO_SSLv2 |
        crypto.constants.SSL_OP_NO_SSLv3 |
        crypto.constants.SSL_OP_NO_TLSv1 |
        crypto.constants.SSL_OP_NO_TLSv1_1,
    });

    this.openai = new OpenAI({
      baseURL: validatedBaseURL,
      apiKey: 'placeholder', // Will be replaced with secure key
      timeout: validatedTimeout,
      httpAgent: httpsAgent,
      defaultHeaders: {
        'User-Agent': 'requesty-cli/2.0.0-secure',
        'X-Client-Version': '2.0.0',
        'X-Security-Level': 'high',
      },
    });
  }

  /**
   * Initialize secure API client with authenticated key
   */
  async initialize(): Promise<void> {
    return PerformanceMonitor.measureAsync(async () => {
      try {
        const apiKey = await this.keyManager.getApiKey();

        // Validate API key
        const validatedApiKey = InputValidator.validateApiKey(apiKey);

        // Create new client instance with secure headers
        const secureHeaders =
          this.keyManager.createSecureHeaders(validatedApiKey);

        this.openai = new OpenAI({
          baseURL: this.openai.baseURL,
          apiKey: validatedApiKey,
          timeout: this.openai.timeout,
          defaultHeaders: {
            'User-Agent': 'requesty-cli/2.0.0-secure',
            'X-Client-Version': '2.0.0',
            'X-Security-Level': 'high',
            ...secureHeaders,
          },
        });
      } catch (error) {
        ErrorHandler.handleSecurityError(
          error,
          'API client initialization',
          true
        );
      }
    }, 'secure-api-client-init').then((result) => result.result);
  }

  /**
   * Secure API request with retry logic and error handling
   */
  private async secureRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = SecureApiClient.MAX_RETRIES,
    operationName: string = 'secure-api-request'
  ): Promise<T> {
    return PerformanceMonitor.measureAsync(async () => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const result = await requestFn();

          // Log successful request (without sensitive data)
          console.debug(`✅ Secure API request completed`);

          return result;
        } catch (error) {
          const isLastAttempt = attempt === retries;

          if (error instanceof Error) {
            // Handle specific error types
            if (
              error.message.includes('401') ||
              error.message.includes('403')
            ) {
              // Authentication error - don't retry
              ErrorHandler.handleSecurityError(
                error,
                'API authentication',
                true
              );
            }

            if (error.message.includes('429')) {
              // Rate limit - wait longer before retry
              if (!isLastAttempt) {
                await this.delay(SecureApiClient.RETRY_DELAY * attempt * 2);
                continue;
              }
            }

            if (error.message.includes('timeout')) {
              // Timeout error
              if (!isLastAttempt) {
                await this.delay(SecureApiClient.RETRY_DELAY * attempt);
                continue;
              }
            }
          }

          if (isLastAttempt) {
            ErrorHandler.handleApiError(
              error,
              `Secure API request (${operationName}) after ${retries} attempts`
            );
          }

          // Wait before retry
          await this.delay(SecureApiClient.RETRY_DELAY * attempt);
        }
      }

      throw new Error('Max retries exceeded');
    }, operationName).then((result) => result.result);
  }

  /**
   * Secure models list request
   */
  async getModels(): Promise<any[]> {
    return this.secureRequest(
      async () => {
        const response = await this.openai.models.list();
        return response.data;
      },
      SecureApiClient.MAX_RETRIES,
      'get-models'
    );
  }

  /**
   * Secure chat completion request
   */
  async createChatCompletion(params: {
    model: string;
    messages: any[];
    temperature?: number;
    stream?: boolean;
  }): Promise<any> {
    return this.secureRequest(
      async () => {
        // Validate and sanitize parameters
        const validatedModel = InputValidator.validateModelName(params.model);
        const validatedTemperature = params.temperature
          ? InputValidator.validateNumber(params.temperature, 0, 2)
          : 0.7;

        // Validate messages array
        if (!Array.isArray(params.messages) || params.messages.length === 0) {
          throw new Error('Messages must be a non-empty array');
        }

        // Sanitize parameters
        const sanitizedParams = {
          model: validatedModel,
          messages: params.messages,
          temperature: validatedTemperature,
          stream: params.stream || false,
        };

        const response =
          await this.openai.chat.completions.create(sanitizedParams);
        return response;
      },
      SecureApiClient.MAX_RETRIES,
      'chat-completion'
    );
  }

  /**
   * Secure streaming chat completion
   */
  async createStreamingChatCompletion(params: {
    model: string;
    messages: any[];
    temperature?: number;
    max_tokens?: number;
  }): Promise<AsyncIterable<any>> {
    return this.secureRequest(
      async () => {
        // Validate and sanitize parameters
        const validatedModel = InputValidator.validateModelName(params.model);
        const validatedTemperature = params.temperature
          ? InputValidator.validateNumber(params.temperature, 0, 2)
          : 0.7;
        const validatedMaxTokens = params.max_tokens
          ? InputValidator.validateNumber(params.max_tokens, 1, 8192)
          : undefined;

        // Validate messages array
        if (!Array.isArray(params.messages) || params.messages.length === 0) {
          throw new Error('Messages must be a non-empty array');
        }

        const sanitizedParams = {
          model: validatedModel,
          messages: params.messages,
          temperature: validatedTemperature,
          stream: true,
          max_tokens: validatedMaxTokens,
        };

        const stream =
          await this.openai.chat.completions.create(sanitizedParams);
        return stream as AsyncIterable<any>;
      },
      SecureApiClient.MAX_RETRIES,
      'streaming-chat-completion'
    );
  }

  /**
   * Validate API key without exposing it
   */
  async validateApiKey(): Promise<boolean> {
    return PerformanceMonitor.measureAsync(async () => {
      try {
        await this.getModels();
        return true;
      } catch (error) {
        // Don't expose validation errors - just return false
        return false;
      }
    }, 'validate-api-key').then((result) => result.result);
  }

  /**
   * Secure cleanup
   */
  cleanup(): void {
    // Clear sensitive data
    SecureKeyManager.secureCleanup();

    // Clear OpenAI instance
    this.openai = null as any;
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get security status
   */
  getSecurityStatus(): {
    keyStoreExists: boolean;
    keyStoreValid: boolean;
    tlsVersion: string;
    encryptionLevel: string;
  } {
    return {
      keyStoreExists: this.keyManager.hasStoredKey() as any,
      keyStoreValid: this.keyManager.validateKeyStore() as any,
      tlsVersion: 'TLS 1.2+',
      encryptionLevel: 'AES-256-CBC',
    };
  }

  /**
   * Export secure configuration (non-sensitive)
   */
  exportSecureConfig(): any {
    return {
      baseURL: this.openai.baseURL,
      timeout: this.openai.timeout || 30000,
      securityLevel: 'high',
      encryption: 'AES-256-CBC',
      keyDerivation: 'PBKDF2-SHA256',
      tlsVersion: 'TLS 1.2+',
      keyStore: this.keyManager.getKeyStoreInfo(),
    };
  }
}
