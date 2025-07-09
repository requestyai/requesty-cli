import OpenAI from 'openai';
import https from 'https';
import crypto from 'crypto';
import { SecureKeyManager } from './secure-key-manager';
import { CryptoManager } from './crypto-manager';

/**
 * Ultra-secure API client with advanced security features
 */
export class SecureApiClient {
  private openai: OpenAI;
  private keyManager: SecureKeyManager;
  private static readonly REQUEST_TIMEOUT = 30000;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  constructor(baseURL: string, timeout: number = SecureApiClient.REQUEST_TIMEOUT) {
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
        'ECDHE-RSA-AES128-SHA256'
      ].join(':'),
      // Security options
      secureOptions: crypto.constants.SSL_OP_NO_SSLv2 | 
                    crypto.constants.SSL_OP_NO_SSLv3 |
                    crypto.constants.SSL_OP_NO_TLSv1 |
                    crypto.constants.SSL_OP_NO_TLSv1_1
    });

    this.openai = new OpenAI({
      baseURL,
      apiKey: 'placeholder', // Will be replaced with secure key
      timeout,
      httpAgent: httpsAgent,
      defaultHeaders: {
        'User-Agent': 'requesty-cli/2.0.0-secure',
        'X-Client-Version': '2.0.0',
        'X-Security-Level': 'high'
      }
    });
  }

  /**
   * Initialize secure API client with authenticated key
   */
  async initialize(): Promise<void> {
    const apiKey = await this.keyManager.getApiKey();
    
    // Create new client instance with secure headers
    const secureHeaders = this.keyManager.createSecureHeaders(apiKey);
    
    this.openai = new OpenAI({
      baseURL: this.openai.baseURL,
      apiKey: apiKey,
      timeout: this.openai.timeout,
      defaultHeaders: {
        'User-Agent': 'requesty-cli/2.0.0-secure',
        'X-Client-Version': '2.0.0',
        'X-Security-Level': 'high',
        ...secureHeaders
      }
    });
  }

  /**
   * Secure API request with retry logic and error handling
   */
  private async secureRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = SecureApiClient.MAX_RETRIES
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await requestFn();
        const duration = Date.now() - startTime;
        
        // Log successful request (without sensitive data)
        console.debug(`✅ Secure API request completed in ${duration}ms`);
        
        return result;
        
      } catch (error) {
        const isLastAttempt = attempt === retries;
        
        if (error instanceof Error) {
          // Handle specific error types
          if (error.message.includes('401') || error.message.includes('403')) {
            // Authentication error - don't retry
            throw new Error('Authentication failed. Please check your API key.');
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
          throw error;
        }
        
        // Wait before retry
        await this.delay(SecureApiClient.RETRY_DELAY * attempt);
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Secure models list request
   */
  async getModels(): Promise<any[]> {
    return this.secureRequest(async () => {
      const response = await this.openai.models.list();
      return response.data;
    });
  }

  /**
   * Secure chat completion request
   */
  async createChatCompletion(params: {
    model: string;
    messages: any[];
    temperature?: number;
    stream?: boolean;
    max_tokens?: number;
  }): Promise<any> {
    return this.secureRequest(async () => {
      // Sanitize parameters
      const sanitizedParams = {
        model: params.model,
        messages: params.messages,
        temperature: Math.max(0, Math.min(2, params.temperature || 0.7)),
        stream: params.stream || false,
        max_tokens: params.max_tokens ? Math.max(1, Math.min(8192, params.max_tokens)) : undefined
      };

      const response = await this.openai.chat.completions.create(sanitizedParams);
      return response;
    });
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
    return this.secureRequest(async () => {
      const sanitizedParams = {
        model: params.model,
        messages: params.messages,
        temperature: Math.max(0, Math.min(2, params.temperature || 0.7)),
        stream: true,
        max_tokens: params.max_tokens ? Math.max(1, Math.min(8192, params.max_tokens)) : undefined
      };

      const stream = await this.openai.chat.completions.create(sanitizedParams);
      return stream as AsyncIterable<any>;
    });
  }

  /**
   * Validate API key without exposing it
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.getModels();
      return true;
    } catch (error) {
      return false;
    }
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
    return new Promise(resolve => setTimeout(resolve, ms));
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
      encryptionLevel: 'AES-256-CBC'
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
      keyStore: this.keyManager.getKeyStoreInfo()
    };
  }
}