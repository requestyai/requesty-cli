/**
 * Mock OpenAI SDK for testing
 */

import { jest } from '@jest/globals';

export class MockOpenAI {
  chat = {
    completions: {
      create: jest.fn(),
      stream: jest.fn()
    }
  };

  models = {
    list: jest.fn()
  };

  constructor(config: any) {
    // Mock constructor
  }
}

// Mock the OpenAI module
jest.mock('openai', () => ({
  OpenAI: MockOpenAI
}));

export default MockOpenAI;