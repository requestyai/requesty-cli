/**
 * Test utilities and helpers
 * Common functions used across different test suites
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestHelper {
  constructor() {
    this.testConfig = {
      apiKey: process.env.REQUESTY_API_KEY || 'test_key_12345',
      baseURL: process.env.REQUESTY_API_BASE_URL || 'http://localhost:3000',
      timeout: 30000,
      mockResponses: true,
    };
  }

  static getInstance() {
    if (!TestHelper.instance) {
      TestHelper.instance = new TestHelper();
    }
    return TestHelper.instance;
  }

  /**
   * Run CLI command and capture output
   */
  async runCLICommand(args = [], options = {}) {
    const startTime = Date.now();
    const cliPath = path.join(__dirname, '../../dist/cli/index.js');

    const env = {
      ...process.env,
      ...options.env,
      REQUESTY_API_KEY: this.testConfig.apiKey,
      REQUESTY_API_BASE_URL: this.testConfig.baseURL,
      NODE_ENV: 'test',
    };

    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, ...args], {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Send input if provided
      if (options.input) {
        child.stdin.write(options.input);
        child.stdin.end();
      }

      // Handle timeout
      const timeout = setTimeout(() => {
        child.kill();
        reject(
          new Error(`Command timed out after ${options.timeout || 30000}ms`)
        );
      }, options.timeout || 30000);

      child.on('close', (code) => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;

        resolve({
          exitCode: code || 0,
          stdout,
          stderr,
          duration,
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Create mock API server responses
   */
  createMockAPIResponse(endpoint, response) {
    // Mock implementation - in real tests, this would set up nock or similar
    const mockFile = path.join(
      __dirname,
      '../fixtures',
      `mock-${endpoint}.json`
    );
    fs.writeFileSync(mockFile, JSON.stringify(response, null, 2));
  }

  /**
   * Load test fixture data
   */
  loadFixture(filename) {
    const fixturePath = path.join(__dirname, '../fixtures', filename);
    const content = fs.readFileSync(fixturePath, 'utf8');
    return filename.endsWith('.json') ? JSON.parse(content) : content;
  }

  /**
   * Clean up test environment
   */
  cleanup() {
    // Clean up any test files, mock servers, etc.
    const tempFiles = [
      '.env.test',
      'test-results.json',
      'tests/fixtures/temp-*.json',
    ];

    tempFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  }

  /**
   * Wait for a condition to be met
   */
  async waitFor(condition, timeout = 5000) {
    const startTime = Date.now();

    while (!condition() && Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  }

  /**
   * Generate test data
   */
  generateTestData(type) {
    switch (type) {
      case 'models':
        return {
          models: [
            { id: 'test-model-1', owned_by: 'test-provider', object: 'model' },
            { id: 'test-model-2', owned_by: 'test-provider', object: 'model' },
          ],
        };

      case 'prompt':
        return 'Test prompt for AI model';

      case 'response':
        return {
          choices: [
            {
              message: { content: 'Test response from AI model' },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 8,
            total_tokens: 18,
          },
        };

      default:
        throw new Error(`Unknown test data type: ${type}`);
    }
  }
}

/**
 * Mock factory for creating test doubles
 */
class MockFactory {
  static createMockAPIClient() {
    return {
      getModels: jest
        .fn()
        .mockResolvedValue(TestHelper.getInstance().generateTestData('models')),
      testModel: jest
        .fn()
        .mockResolvedValue(
          TestHelper.getInstance().generateTestData('response')
        ),
      stream: jest.fn().mockImplementation(function* () {
        yield 'Test ';
        yield 'streaming ';
        yield 'response';
      }),
    };
  }

  static createMockTerminalUI() {
    return {
      showHeader: jest.fn(),
      showModelList: jest.fn(),
      showPrompt: jest.fn(),
      showResults: jest.fn(),
      showError: jest.fn(),
      createSpinner: jest.fn().mockReturnValue({
        start: jest.fn(),
        stop: jest.fn(),
        succeed: jest.fn(),
        fail: jest.fn(),
      }),
    };
  }

  static createMockSecurityManager() {
    return {
      encryptData: jest.fn().mockResolvedValue('encrypted_data'),
      decryptData: jest.fn().mockResolvedValue('decrypted_data'),
      generateKey: jest.fn().mockResolvedValue('generated_key'),
      validateKey: jest.fn().mockResolvedValue(true),
    };
  }
}

module.exports = {
  TestHelper,
  MockFactory,
};
