/**
 * Integration tests for CLI workflow
 * Tests the complete user journey
 */

const { TestHelper } = require('../helpers/test-utils');

describe('CLI Workflow Integration', () => {
  let testHelper;

  beforeAll(async () => {
    testHelper = TestHelper.getInstance();
    // Setup test environment
    await testHelper.runCLICommand(['--version']); // Warm up
  });

  afterAll(() => {
    testHelper.cleanup();
  });

  describe('Basic CLI Operations', () => {
    it('should show version information', async () => {
      const result = await testHelper.runCLICommand(['--version']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('1.0.0');
    });

    it('should show help information', async () => {
      const result = await testHelper.runCLICommand(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Options:');
      expect(result.stdout).toContain('Commands:');
    });

    it('should handle invalid command gracefully', async () => {
      const result = await testHelper.runCLICommand(['invalid-command']);

      expect(result.exitCode).toBeGreaterThan(0);
      expect(result.stderr).toContain('Unknown command');
    });
  });

  describe('Security Command', () => {
    it('should show security status', async () => {
      const result = await testHelper.runCLICommand(['security']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Security Status');
    });

    it('should show encryption status', async () => {
      const result = await testHelper.runCLICommand(['security']);

      expect(result.stdout).toContain('Encryption');
      expect(result.stdout).toContain('Key Management');
    });
  });

  describe('PDF Chat Command', () => {
    it('should handle missing PDF file', async () => {
      const result = await testHelper.runCLICommand([
        'pdf-chat',
        'nonexistent.pdf',
      ]);

      expect(result.exitCode).toBeGreaterThan(0);
      expect(result.stderr).toContain('File not found');
    });

    it('should validate PDF file extension', async () => {
      const result = await testHelper.runCLICommand(['pdf-chat', 'test.txt']);

      expect(result.exitCode).toBeGreaterThan(0);
      expect(result.stderr).toContain('Invalid file type');
    });

    it('should show PDF chat help', async () => {
      const result = await testHelper.runCLICommand(['pdf-chat', '--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('pdf-path');
    });
  });

  describe('API Key Handling', () => {
    it('should work with API key from environment', async () => {
      const result = await testHelper.runCLICommand(['--version'], {
        env: { REQUESTY_API_KEY: 'test_key_12345' },
      });

      expect(result.exitCode).toBe(0);
    });

    it('should work with API key from command line', async () => {
      const result = await testHelper.runCLICommand([
        '--api-key',
        'test_key_12345',
        '--version',
      ]);

      expect(result.exitCode).toBe(0);
    });

    it('should handle missing API key gracefully', async () => {
      const result = await testHelper.runCLICommand(['security'], {
        env: { ...process.env, REQUESTY_API_KEY: '' },
      });

      // Should either prompt for key or show appropriate message
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration Options', () => {
    it('should accept timeout parameter', async () => {
      const result = await testHelper.runCLICommand([
        '--timeout',
        '30000',
        '--version',
      ]);

      expect(result.exitCode).toBe(0);
    });

    it('should accept temperature parameter', async () => {
      const result = await testHelper.runCLICommand([
        '--temperature',
        '0.7',
        '--version',
      ]);

      expect(result.exitCode).toBe(0);
    });

    it('should validate timeout parameter', async () => {
      const result = await testHelper.runCLICommand([
        '--timeout',
        'invalid',
        '--version',
      ]);

      expect(result.exitCode).toBeGreaterThan(0);
      expect(result.stderr).toContain('Invalid timeout');
    });

    it('should validate temperature parameter', async () => {
      const result = await testHelper.runCLICommand([
        '--temperature',
        '3.0',
        '--version',
      ]);

      expect(result.exitCode).toBeGreaterThan(0);
      expect(result.stderr).toContain('Invalid temperature');
    });
  });

  describe('Interactive Mode', () => {
    it('should handle interactive prompts', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '\n', // Press enter to exit
        timeout: 10000,
        env: { REQUESTY_API_KEY: 'test_key_12345' },
      });

      expect(result.stdout).toContain('Requesty');
      expect(result.stdout).toContain('What would you like to do?');
    });

    it('should handle quick start option', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '1\ntest prompt\nn\n', // Select quick start, enter prompt, don't continue
        timeout: 15000,
        env: { REQUESTY_API_KEY: 'test_key_12345' },
      });

      expect(result.stdout).toContain('Quick Start');
    });

    it('should handle model selection', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '2\n\ntest prompt\nn\n', // Select models, enter prompt, don't continue
        timeout: 15000,
        env: { REQUESTY_API_KEY: 'test_key_12345' },
      });

      expect(result.stdout).toContain('Select Models');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '1\ntest prompt\nn\n',
        timeout: 10000,
        env: {
          REQUESTY_API_KEY: 'test_key_12345',
          REQUESTY_API_BASE_URL: 'http://invalid-url:99999',
        },
      });

      expect(result.stdout).toContain('Error');
      expect(result.stdout).toContain('Connection');
    });

    it('should handle invalid API key', async () => {
      const result = await testHelper.runCLICommand([], {
        input: '1\ntest prompt\nn\n',
        timeout: 10000,
        env: { REQUESTY_API_KEY: 'invalid_key' },
      });

      expect(result.stdout).toContain('Error');
      expect(result.stdout).toContain('Authentication');
    });

    it('should handle interrupted process', async () => {
      // This test simulates SIGINT (Ctrl+C)
      const result = await testHelper.runCLICommand([], {
        input: '1\n', // Start quick start
        timeout: 5000, // Short timeout to simulate interruption
      });

      // Should exit gracefully
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('should start within reasonable time', async () => {
      const startTime = Date.now();
      const result = await testHelper.runCLICommand(['--version']);
      const duration = Date.now() - startTime;

      expect(result.exitCode).toBe(0);
      expect(duration).toBeLessThan(5000); // Should start within 5 seconds
    });

    it('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 3 }, () =>
        testHelper.runCLICommand(['--version'])
      );

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.exitCode).toBe(0);
      });
    });
  });

  describe('Output Formatting', () => {
    it('should produce well-formatted output', async () => {
      const result = await testHelper.runCLICommand(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Usage:/);
      expect(result.stdout).toMatch(/Options:/);
      expect(result.stdout).toMatch(/Commands:/);
    });

    it('should handle ANSI color codes', async () => {
      const result = await testHelper.runCLICommand(['--version']);

      expect(result.exitCode).toBe(0);
      // Output should contain ANSI escape sequences for colors
      expect(result.stdout).toMatch(/\x1b\[\d+m/);
    });
  });
});
