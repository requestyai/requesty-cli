/**
 * Unit tests for input validation - security critical
 */

import { InputValidator } from '../../../src/utils/input-validator';
import { TestHelper } from '../../helpers/test-utils';

describe('InputValidator', () => {
  let testHelper: TestHelper;

  beforeEach(() => {
    testHelper = TestHelper.getInstance();
  });

  afterEach(() => {
    testHelper.cleanup();
  });

  describe('validatePrompt', () => {
    it('should accept valid prompts', () => {
      const validPrompts = [
        'What is the capital of France?',
        'Explain quantum computing in simple terms',
        'Write a Python function to sort an array',
        'Tell me a joke about programming',
        'How do I learn TypeScript?'
      ];

      validPrompts.forEach(prompt => {
        expect(() => InputValidator.validatePrompt(prompt)).not.toThrow();
        expect(InputValidator.validatePrompt(prompt)).toBe(prompt);
      });
    });

    it('should reject empty or invalid prompts', () => {
      const invalidPrompts = [
        '',
        '   ',
        null,
        undefined,
        'a'.repeat(10001) // Too long
      ];

      invalidPrompts.forEach(prompt => {
        expect(() => InputValidator.validatePrompt(prompt as string)).toThrow();
      });
    });

    it('should sanitize potentially harmful prompts', () => {
      const maliciousPrompts = [
        '<script>alert("xss")</script>',
        'DROP TABLE users;',
        '${system.exit(0)}',
        'eval("malicious code")'
      ];

      maliciousPrompts.forEach(prompt => {
        const sanitized = InputValidator.validatePrompt(prompt);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('DROP TABLE');
        expect(sanitized).not.toContain('eval(');
      });
    });
  });

  describe('validateModelName', () => {
    it('should accept valid model names', () => {
      const validModels = [
        'gpt-4',
        'claude-3-sonnet',
        'gemini-pro',
        'test-model-1',
        'provider/model-name'
      ];

      validModels.forEach(model => {
        expect(() => InputValidator.validateModelName(model)).not.toThrow();
        expect(InputValidator.validateModelName(model)).toBe(model);
      });
    });

    it('should reject invalid model names', () => {
      const invalidModels = [
        '',
        '   ',
        'model with spaces',
        'model/with/too/many/slashes',
        'model-with-special-chars!@#',
        'a'.repeat(201) // Too long
      ];

      invalidModels.forEach(model => {
        expect(() => InputValidator.validateModelName(model)).toThrow();
      });
    });
  });

  describe('validateApiKey', () => {
    it('should accept valid API keys', () => {
      const validKeys = [
        'sk-1234567890abcdef',
        'key_abcdef123456',
        'test_key_12345',
        'ak-' + 'a'.repeat(40)
      ];

      validKeys.forEach(key => {
        expect(() => InputValidator.validateApiKey(key)).not.toThrow();
        expect(InputValidator.validateApiKey(key)).toBe(key);
      });
    });

    it('should reject invalid API keys', () => {
      const invalidKeys = [
        '',
        '   ',
        'short',
        'key with spaces',
        'key-with-special-chars!@#',
        'a'.repeat(301) // Too long
      ];

      invalidKeys.forEach(key => {
        expect(() => InputValidator.validateApiKey(key)).toThrow();
      });
    });
  });

  describe('validateUrl', () => {
    it('should accept valid URLs', () => {
      const validUrls = [
        'https://api.example.com',
        'http://localhost:3000',
        'https://api.requesty.io/v1',
        'https://example.com/api/v1'
      ];

      validUrls.forEach(url => {
        expect(() => InputValidator.validateUrl(url)).not.toThrow();
        expect(InputValidator.validateUrl(url)).toBe(url);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        '',
        'not-a-url',
        'ftp://example.com',
        'javascript:alert("xss")',
        'file:///etc/passwd'
      ];

      invalidUrls.forEach(url => {
        expect(() => InputValidator.validateUrl(url)).toThrow();
      });
    });

    it('should handle localhost URLs based on configuration', () => {
      const localhostUrls = [
        'http://localhost:3000',
        'http://127.0.0.1:8080',
        'http://localhost'
      ];

      localhostUrls.forEach(url => {
        // Should not throw in test environment
        expect(() => InputValidator.validateUrl(url)).not.toThrow();
      });
    });
  });

  describe('validateFilePath', () => {
    it('should accept valid file paths', () => {
      const validPaths = [
        '/home/user/document.pdf',
        './local/file.txt',
        '../relative/path.pdf',
        'simple-filename.pdf'
      ];

      validPaths.forEach(path => {
        expect(() => InputValidator.validateFilePath(path)).not.toThrow();
        expect(InputValidator.validateFilePath(path)).toBe(path);
      });
    });

    it('should reject path traversal attempts', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        '/etc/passwd',
        'file://etc/passwd',
        'C:\\Windows\\System32'
      ];

      maliciousPaths.forEach(path => {
        expect(() => InputValidator.validateFilePath(path)).toThrow();
      });
    });

    it('should reject suspicious file extensions', () => {
      const suspiciousFiles = [
        'file.exe',
        'script.bat',
        'malware.scr',
        'virus.com'
      ];

      suspiciousFiles.forEach(file => {
        expect(() => InputValidator.validateFilePath(file)).toThrow();
      });
    });
  });

  describe('validateTimeout', () => {
    it('should accept valid timeout values', () => {
      const validTimeouts = [1000, 5000, 30000, 60000];

      validTimeouts.forEach(timeout => {
        expect(() => InputValidator.validateTimeout(timeout)).not.toThrow();
        expect(InputValidator.validateTimeout(timeout)).toBe(timeout);
      });
    });

    it('should reject invalid timeout values', () => {
      const invalidTimeouts = [-1, 0, 300001, NaN, Infinity];

      invalidTimeouts.forEach(timeout => {
        expect(() => InputValidator.validateTimeout(timeout)).toThrow();
      });
    });
  });

  describe('validateTemperature', () => {
    it('should accept valid temperature values', () => {
      const validTemperatures = [0, 0.5, 0.7, 1.0, 1.5, 2.0];

      validTemperatures.forEach(temp => {
        expect(() => InputValidator.validateTemperature(temp)).not.toThrow();
        expect(InputValidator.validateTemperature(temp)).toBe(temp);
      });
    });

    it('should reject invalid temperature values', () => {
      const invalidTemperatures = [-1, -0.1, 2.1, NaN, Infinity];

      invalidTemperatures.forEach(temp => {
        expect(() => InputValidator.validateTemperature(temp)).toThrow();
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should remove harmful characters', () => {
      const inputs = [
        { input: '<script>alert("xss")</script>', expected: 'alert("xss")' },
        { input: 'DROP TABLE users;', expected: 'DROP TABLE users;' },
        { input: 'Normal text', expected: 'Normal text' }
      ];

      inputs.forEach(({ input, expected }) => {
        const sanitized = InputValidator.sanitizeInput(input);
        expect(sanitized).toBe(expected);
      });
    });

    it('should handle edge cases', () => {
      expect(InputValidator.sanitizeInput('')).toBe('');
      expect(InputValidator.sanitizeInput('   ')).toBe('   ');
      expect(() => InputValidator.sanitizeInput(null as any)).toThrow();
      expect(() => InputValidator.sanitizeInput(undefined as any)).toThrow();
    });
  });

  describe('security patterns', () => {
    it('should detect SQL injection attempts', () => {
      const sqlInjectionPatterns = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users--"
      ];

      sqlInjectionPatterns.forEach(pattern => {
        expect(() => InputValidator.validatePrompt(pattern)).toThrow();
      });
    });

    it('should detect XSS attempts', () => {
      const xssPatterns = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("xss")',
        '<svg onload="alert(1)">'
      ];

      xssPatterns.forEach(pattern => {
        const sanitized = InputValidator.sanitizeInput(pattern);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
      });
    });

    it('should detect command injection attempts', () => {
      const commandInjectionPatterns = [
        '; rm -rf /',
        '| cat /etc/passwd',
        '&& rm important_file',
        '$(cat /etc/passwd)'
      ];

      commandInjectionPatterns.forEach(pattern => {
        expect(() => InputValidator.validatePrompt(pattern)).toThrow();
      });
    });
  });
});