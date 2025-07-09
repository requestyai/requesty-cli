/**
 * Mock file system module for testing
 */

import { jest } from '@jest/globals';

export const mockFs = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn()
  }
};

jest.mock('fs', () => mockFs);

export default mockFs;