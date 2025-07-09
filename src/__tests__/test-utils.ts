/**
 * Test utilities and helper functions
 */

import { jest } from '@jest/globals';

export class TestUtils {
  /**
   * Create a mock OpenAI client
   */
  static createMockOpenAIClient() {
    return {
      chat: {
        completions: {
          create: jest.fn(),
          stream: jest.fn()
        }
      },
      models: {
        list: jest.fn()
      }
    };
  }

  /**
   * Create a mock CLI configuration
   */
  static createMockConfig() {
    return {
      baseURL: 'https://api.test.com',
      apiKey: 'test-api-key-123',
      timeout: 30000
    };
  }

  /**
   * Create a mock command result
   */
  static createMockCommandResult(success = true, data?: any, message?: string) {
    return {
      success,
      data,
      message,
      timestamp: new Date().toISOString(),
      command: 'test-command'
    };
  }

  /**
   * Create a mock performance metrics
   */
  static createMockPerformanceMetrics() {
    return {
      totalCalls: 10,
      successfulCalls: 8,
      failedCalls: 2,
      totalDuration: 5000,
      averageDuration: 500,
      minDuration: 100,
      maxDuration: 1000,
      lastCall: Date.now()
    };
  }

  /**
   * Create a mock validation result
   */
  static createMockValidationResult(isValid = true, value?: any, error?: string) {
    return {
      isValid,
      value,
      error
    };
  }

  /**
   * Create a mock cache entry
   */
  static createMockCacheEntry(data: any, ttl = 300000) {
    return {
      data,
      expiry: Date.now() + ttl,
      created: Date.now(),
      accessed: Date.now(),
      accessCount: 1
    };
  }

  /**
   * Create a mock connection pool stats
   */
  static createMockConnectionPoolStats() {
    return {
      totalConnections: 5,
      maxPoolSize: 10,
      totalUsage: 25,
      activeConnections: 5,
      connections: [
        { key: 'test-key-1', usage: 10, lastUsed: Date.now() },
        { key: 'test-key-2', usage: 15, lastUsed: Date.now() }
      ]
    };
  }

  /**
   * Create a mock stream response
   */
  static createMockStreamResponse() {
    return {
      id: 'test-stream-123',
      object: 'chat.completion.chunk',
      created: Date.now(),
      model: 'gpt-4',
      choices: [{
        delta: {
          content: 'Test response'
        },
        index: 0,
        finish_reason: null
      }]
    };
  }

  /**
   * Create a mock file system error
   */
  static createMockFileSystemError(code: string, path: string) {
    const error = new Error(`File system error: ${code}`) as any;
    error.code = code;
    error.path = path;
    return error;
  }

  /**
   * Create a mock security error
   */
  static createMockSecurityError(message: string, sensitive = false) {
    const error = new Error(message) as any;
    error.sensitive = sensitive;
    error.type = 'security';
    return error;
  }

  /**
   * Wait for a promise to resolve or reject
   */
  static async waitFor(fn: () => boolean, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (fn()) return;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error('Timeout waiting for condition');
  }

  /**
   * Suppress console output during test
   */
  static suppressConsole() {
    const originalConsole = global.console;
    global.console = {
      ...console,
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn()
    };
    return () => {
      global.console = originalConsole;
    };
  }

  /**
   * Create a mock PDF file buffer
   */
  static createMockPDFBuffer(): Buffer {
    return Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \n0000000179 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n274\n%%EOF');
  }

  /**
   * Create a mock command metadata
   */
  static createMockCommandMetadata(overrides: Partial<any> = {}) {
    return {
      name: 'test-command',
      description: 'Test command description',
      category: 'test',
      requiresAuth: true,
      requiresInteraction: true,
      ...overrides
    };
  }

  /**
   * Create a mock encrypted data object
   */
  static createMockEncryptedData() {
    return {
      encrypted: Buffer.from('encrypted-data'),
      iv: Buffer.from('initialization-vector'),
      tag: Buffer.from('auth-tag')
    };
  }

  /**
   * Verify that a function throws an error with specific message
   */
  static async expectToThrow(fn: () => any, expectedMessage?: string) {
    try {
      await fn();
      throw new Error('Expected function to throw');
    } catch (error) {
      if (expectedMessage && error instanceof Error) {
        expect(error.message).toContain(expectedMessage);
      }
      return error;
    }
  }

  /**
   * Create a deterministic mock date
   */
  static mockDate(timestamp = 1640995200000) { // 2022-01-01 00:00:00 UTC
    const mockDate = new Date(timestamp);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    return mockDate;
  }

  /**
   * Create a mock inquirer response
   */
  static createMockInquirerResponse(answers: Record<string, any>) {
    const inquirer = require('inquirer');
    jest.spyOn(inquirer, 'prompt').mockResolvedValue(answers);
    return inquirer;
  }

  /**
   * Create a mock progress bar
   */
  static createMockProgressBar() {
    return {
      start: jest.fn(),
      update: jest.fn(),
      stop: jest.fn(),
      increment: jest.fn()
    };
  }
}