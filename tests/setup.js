/**
 * Jest setup file - runs before each test
 */

// Setup test environment
process.env.NODE_ENV = 'test';
process.env.REQUESTY_API_KEY = 'test_key_12345';
process.env.REQUESTY_API_BASE_URL = 'http://localhost:3000';

// Mock console methods in tests to avoid noise
const originalConsole = { ...console };

beforeEach(() => {
  // Reset console mocks
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();
});

afterEach(() => {
  // Restore original console methods
  Object.assign(console, originalConsole);

  // Clear all mocks
  jest.clearAllMocks();
});

// Global test helpers
global.testHelpers = {
  // Helper to restore console for debugging
  restoreConsole: () => {
    Object.assign(console, originalConsole);
  },

  // Helper to wait for promises to resolve
  flushPromises: () => new Promise((resolve) => setImmediate(resolve)),

  // Helper to create mock timers
  useFakeTimers: () => {
    jest.useFakeTimers();
  },

  // Helper to restore real timers
  useRealTimers: () => {
    jest.useRealTimers();
  },
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Increase timeout for async operations
jest.setTimeout(30000);
