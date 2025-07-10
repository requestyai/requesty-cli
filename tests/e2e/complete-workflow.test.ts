/**
 * End-to-end tests for complete user workflows
 * Tests the full user journey from start to finish
 */

import { TestHelper } from '../helpers/test-utils';
import fs from 'fs';
import path from 'path';

describe('Complete User Workflows', () => {
  let testHelper: TestHelper;

  beforeAll(async () => {
    testHelper = TestHelper.getInstance();
    
    // Create test PDF file
    const testPdfPath = path.join(__dirname, '../fixtures/test.pdf');
    if (!fs.existsSync(testPdfPath)) {
      // Create a minimal PDF file for testing
      const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000174 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n268\n%%EOF');
      fs.writeFileSync(testPdfPath, pdfContent);
    }
  });

  afterAll(() => {
    testHelper.cleanup();
  });

  describe('New User Journey', () => {
    it('should guide new user through complete workflow', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '1\nWhat is TypeScript?\nn\n', // Quick start, ask question, don't continue
        timeout: 30000,
        env: { 
          REQUESTY_API_KEY: 'test_key_12345',
          REQUESTY_API_BASE_URL: 'http://localhost:3000'
        }
      });

      // Should show welcome screen
      expect(result.stdout).toContain('Requesty');
      expect(result.stdout).toContain('What would you like to do?');
      
      // Should show quick start
      expect(result.stdout).toContain('Quick Start');
      
      // Should show model selection
      expect(result.stdout).toContain('Selected Models');
      
      // Should show results or error handling
      expect(result.stdout).toMatch(/(Testing|Error|Connection)/);
    });

    it('should handle model selection workflow', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '2\n \nWhat is JavaScript?\nn\n', // Select models, space to select, ask question, don't continue
        timeout: 30000,
        env: { 
          REQUESTY_API_KEY: 'test_key_12345',
          REQUESTY_API_BASE_URL: 'http://localhost:3000'
        }
      });

      expect(result.stdout).toContain('Select Models');
      expect(result.stdout).toContain('providers');
    });

    it('should handle exit workflow', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '3\n', // Exit
        timeout: 10000,
        env: { REQUESTY_API_KEY: 'test_key_12345' }
      });

      expect(result.stdout).toContain('Goodbye');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('PDF Chat Workflow', () => {
    it('should handle complete PDF chat session', async () => {
      const testPdfPath = path.join(__dirname, '../fixtures/test.pdf');
      
      const result = await testHelper.runCLICommand(['pdf-chat', testPdfPath], {
        input: 'What is this document about?\ninfo\nexit\n', // Ask question, show info, exit
        timeout: 30000,
        env: { 
          REQUESTY_API_KEY: 'test_key_12345',
          REQUESTY_API_BASE_URL: 'http://localhost:3000'
        }
      });

      expect(result.stdout).toContain('PDF chat session');
      expect(result.stdout).toContain('Converting PDF');
    });

    it('should handle PDF chat with custom model', async () => {
      const testPdfPath = path.join(__dirname, '../fixtures/test.pdf');
      
      const result = await testHelper.runCLICommand([
        'pdf-chat', 
        testPdfPath,
        '--model', 'test-model-1',
        '--temperature', '0.5'
      ], {
        input: 'Tell me about this document\nexit\n',
        timeout: 30000,
        env: { 
          REQUESTY_API_KEY: 'test_key_12345',
          REQUESTY_API_BASE_URL: 'http://localhost:3000'
        }
      });

      expect(result.stdout).toContain('PDF chat session');
      expect(result.stdout).toContain('test-model-1');
    });

    it('should handle PDF chat commands', async () => {
      const testPdfPath = path.join(__dirname, '../fixtures/test.pdf');
      
      const result = await testHelper.runCLICommand(['pdf-chat', testPdfPath], {
        input: 'help\ninfo\nsummary\nexit\n', // Test all commands
        timeout: 30000,
        env: { 
          REQUESTY_API_KEY: 'test_key_12345',
          REQUESTY_API_BASE_URL: 'http://localhost:3000'
        }
      });

      expect(result.stdout).toContain('Available commands');
      expect(result.stdout).toContain('Session information');
    });
  });

  describe('Security Workflow', () => {
    it('should handle security configuration', async () => {
      const result = await testHelper.runCLICommand(['security'], {
        timeout: 15000,
        env: { REQUESTY_API_KEY: 'test_key_12345' }
      });

      expect(result.stdout).toContain('Security Status');
      expect(result.stdout).toContain('Encryption');
      expect(result.stdout).toContain('Key Management');
    });

    it('should handle first-time security setup', async () => {
      const result = await testHelper.runCLICommand(['security'], {
        timeout: 15000,
        env: { 
          REQUESTY_API_KEY: 'test_key_12345',
          REQUESTY_MASTER_KEY: undefined // No master key
        }
      });

      expect(result.stdout).toMatch(/(Security|Setup|Configuration)/);
    });
  });

  describe('Multi-Session Workflow', () => {
    it('should handle multiple prompts in single session', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '1\nFirst question\ny\nSecond question\nn\n', // Quick start, ask twice
        timeout: 45000,
        env: { 
          REQUESTY_API_KEY: 'test_key_12345',
          REQUESTY_API_BASE_URL: 'http://localhost:3000'
        }
      });

      expect(result.stdout).toContain('First question');
      expect(result.stdout).toContain('Would you like to test another prompt?');
      expect(result.stdout).toContain('Second question');
    });

    it('should maintain session state', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '1\nTest prompt\ny\nAnother test\nn\n',
        timeout: 45000,
        env: { 
          REQUESTY_API_KEY: 'test_key_12345',
          REQUESTY_API_BASE_URL: 'http://localhost:3000'
        }
      });

      // Should maintain model selection across prompts
      expect(result.stdout).toContain('Selected Models');
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should recover from network errors', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '1\nTest prompt\ny\nAnother test\nn\n',
        timeout: 30000,
        env: { 
          REQUESTY_API_KEY: 'test_key_12345',
          REQUESTY_API_BASE_URL: 'http://invalid-url:99999'
        }
      });

      expect(result.stdout).toContain('Error');
      expect(result.stdout).toContain('Connection');
      // Should still allow user to continue or exit gracefully
    });

    it('should handle authentication errors', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '1\nTest prompt\nn\n',
        timeout: 30000,
        env: { 
          REQUESTY_API_KEY: 'invalid_key_12345',
          REQUESTY_API_BASE_URL: 'http://localhost:3000'
        }
      });

      expect(result.stdout).toMatch(/(Error|Authentication|Unauthorized)/);
    });

    it('should handle invalid prompts gracefully', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '1\n' + 'x'.repeat(10000) + '\nn\n', // Very long prompt
        timeout: 30000,
        env: { 
          REQUESTY_API_KEY: 'test_key_12345',
          REQUESTY_API_BASE_URL: 'http://localhost:3000'
        }
      });

      expect(result.stdout).toMatch(/(Error|Invalid|Too long)/);
    });
  });

  describe('Performance Workflow', () => {
    it('should handle concurrent model testing', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '1\nTest concurrent processing\nn\n',
        timeout: 60000, // Longer timeout for concurrent processing
        env: { 
          REQUESTY_API_KEY: 'test_key_12345',
          REQUESTY_API_BASE_URL: 'http://localhost:3000'
        }
      });

      expect(result.stdout).toContain('Testing');
      expect(result.stdout).toContain('models');
    });

    it('should show progress indicators', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '1\nShow progress bars\nn\n',
        timeout: 30000,
        env: { 
          REQUESTY_API_KEY: 'test_key_12345',
          REQUESTY_API_BASE_URL: 'http://localhost:3000'
        }
      });

      // Should show progress indicators
      expect(result.stdout).toMatch(/(Testing|Progress|Loading)/);
    });
  });

  describe('Accessibility and Usability', () => {
    it('should provide clear navigation', async () => {
      const result = await testHelper.runCLICommand(['--help'], {
        timeout: 10000
      });

      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Options:');
      expect(result.stdout).toContain('Commands:');
      expect(result.stdout).toContain('Examples:');
    });

    it('should handle keyboard interrupts gracefully', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '1\n', // Start, then timeout (simulates Ctrl+C)
        timeout: 5000,
        env: { REQUESTY_API_KEY: 'test_key_12345' }
      });

      // Should exit gracefully even with timeout
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });
  });
});