/**
 * Jest test setup and global configurations
 */

// Global test timeout
jest.setTimeout(30000);

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};

// Mock process.env
process.env.NODE_ENV = 'test';
process.env.DEBUG = 'false';

// Global test utilities
global.testUtils = {
  createMockConfig: () => ({
    baseURL: 'https://api.test.com',
    apiKey: 'test-api-key-123',
    timeout: 30000
  }),
  
  createMockError: (message: string) => new Error(message),
  
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  createMockResponse: (data: any, success = true) => ({
    success,
    data,
    timestamp: new Date().toISOString()
  })
};

// Add global type definitions for test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        createMockConfig: () => any;
        createMockError: (message: string) => Error;
        sleep: (ms: number) => Promise<void>;
        createMockResponse: (data: any, success?: boolean) => any;
      };
    }
  }
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});