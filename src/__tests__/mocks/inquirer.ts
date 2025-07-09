/**
 * Mock inquirer module for testing
 */

import { jest } from '@jest/globals';

export const mockInquirer = {
  prompt: jest.fn(),
  createPromptModule: jest.fn()
};

jest.mock('inquirer', () => mockInquirer);

export default mockInquirer;