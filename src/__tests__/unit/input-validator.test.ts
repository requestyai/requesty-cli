/**
 * Unit tests for Input Validator
 */

import { InputValidator } from '../../utils/input-validator';
import { TestUtils } from '../test-utils';

describe('InputValidator', () => {
  describe('validatePrompt', () => {
    it('should validate valid prompts', () => {
      const validPrompts = [
        'Hello world',
        'This is a test prompt with numbers 123',
        'Special characters: !@#$%^&*()_+-=[]{}|;:,.<>?',
        'Multi-line\nprompt with\ntabs and spaces'
      ];

      validPrompts.forEach(prompt => {
        const result = InputValidator.validatePrompt(prompt);
        expect(result).toBe(prompt.replace(/\s+/g, ' ').trim());
      });
    });

    it('should reject empty or whitespace-only prompts', () => {
      const invalidPrompts = ['', '   ', '\t\n\r'];

      invalidPrompts.forEach(prompt => {
        expect(() => {
          InputValidator.validatePrompt(prompt);
        }).toThrow();
      });
    });

    it('should reject prompts that are too long', () => {
      const longPrompt = 'a'.repeat(10001);
      
      expect(() => {
        InputValidator.validatePrompt(longPrompt);
      }).toThrow();
    });

    it('should reject prompts with suspicious patterns', () => {
      const suspiciousPrompts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'onload=alert("xss")',
        'eval(malicious_code)',
        'expression(alert("xss"))'
      ];

      suspiciousPrompts.forEach(prompt => {
        expect(() => {
          InputValidator.validatePrompt(prompt);
        }).toThrow('Prompt contains potentially malicious content');
      });
    });

    it('should sanitize control characters', () => {
      const promptWithControlChars = 'Hello\x00\x1F\x7F\x9FWorld';
      const result = InputValidator.validatePrompt(promptWithControlChars);
      
      expect(result).toBe('HelloWorld');
    });
  });

  describe('validateApiKey', () => {
    it('should validate valid API keys', () => {
      const validKeys = [
        'sk-1234567890abcdef1234567890abcdef',
        'api-key-123456789012345678901234567890',
        'valid_api_key_with_underscores_123'
      ];

      validKeys.forEach(key => {
        const result = InputValidator.validateApiKey(key);
        expect(result).toBe(key);
      });
    });

    it('should reject keys that are too short', () => {
      const shortKey = 'short';
      
      expect(() => {
        InputValidator.validateApiKey(shortKey);
      }).toThrow();
    });

    it('should reject keys that are too long', () => {
      const longKey = 'a'.repeat(257);
      
      expect(() => {
        InputValidator.validateApiKey(longKey);
      }).toThrow();
    });

    it('should reject keys with invalid characters', () => {
      const invalidKeys = [
        'key with spaces',
        'key@with!special#chars',
        'key/with\\slashes'
      ];

      invalidKeys.forEach(key => {
        expect(() => {
          InputValidator.validateApiKey(key);
        }).toThrow();
      });
    });

    it('should detect and reject test API keys', () => {
      const testKeys = [
        'test-api-key',
        'demo_api_key',
        'sample-key-123',
        'placeholder-key',
        'your-api-key',
        'sk-12345678-1234-1234-1234-123456789012'
      ];

      testKeys.forEach(key => {
        expect(() => {
          InputValidator.validateApiKey(key);
        }).toThrow('Test or placeholder API key detected');
      });
    });
  });

  describe('validateModelName', () => {
    it('should validate valid model names', () => {
      const validNames = [
        'gpt-4',
        'gpt-3.5-turbo',
        'claude-2',
        'text-davinci-003',
        'provider/model-name'
      ];

      validNames.forEach(name => {
        const result = InputValidator.validateModelName(name);
        expect(result).toBe(name);
      });
    });

    it('should reject empty model names', () => {
      expect(() => {
        InputValidator.validateModelName('');
      }).toThrow();
    });

    it('should reject model names that are too long', () => {
      const longName = 'a'.repeat(101);
      
      expect(() => {
        InputValidator.validateModelName(longName);
      }).toThrow();
    });

    it('should reject model names with invalid characters', () => {
      const invalidNames = [
        'model name with spaces',
        'model@name',
        'model#name',
        'model%name'
      ];

      invalidNames.forEach(name => {
        expect(() => {
          InputValidator.validateModelName(name);
        }).toThrow();
      });
    });
  });

  describe('validateUrl', () => {
    it('should validate valid URLs', () => {
      const validUrls = [
        'https://api.example.com',
        'http://localhost:3000',
        'https://subdomain.example.com/path',
        'https://example.com:8080/api/v1'
      ];

      validUrls.forEach(url => {
        const result = InputValidator.validateUrl(url);
        expect(result).toBe(url);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>'
      ];

      invalidUrls.forEach(url => {
        expect(() => {
          InputValidator.validateUrl(url);
        }).toThrow();
      });
    });

    it('should handle localhost URLs based on allowed ports', () => {
      const allowedLocalhosts = [
        'http://localhost:3000',
        'http://localhost:8000',
        'http://localhost:8080',
        'http://localhost:5000'
      ];

      allowedLocalhosts.forEach(url => {
        const result = InputValidator.validateUrl(url);
        expect(result).toBe(url);
      });
    });

    it('should reject disallowed localhost URLs', () => {
      const disallowedLocalhosts = [
        'http://localhost:22',
        'http://localhost:80',
        'http://127.0.0.1:9999'
      ];

      disallowedLocalhosts.forEach(url => {
        expect(() => {
          InputValidator.validateUrl(url);
        }).toThrow('Localhost URLs are not allowed');
      });
    });
  });

  describe('validateFilePath', () => {
    it('should validate valid file paths', () => {
      const validPaths = [
        '/home/user/document.txt',
        'C:\\Users\\Test\\file.pdf',
        './relative/path/file.json',
        'simple-filename.txt'
      ];

      validPaths.forEach(path => {
        const result = InputValidator.validateFilePath(path);
        expect(result).toBe(path);
      });
    });

    it('should reject paths with path traversal attempts', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config',
        '/path/to/../../../sensitive/file',
        'C:\\path\\to\\..\\..\\sensitive\\file'
      ];

      maliciousPaths.forEach(path => {
        expect(() => {
          InputValidator.validateFilePath(path);
        }).toThrow('Path traversal detected in file path');
      });
    });

    it('should reject paths with suspicious extensions', () => {
      const suspiciousPaths = [
        'malware.exe',
        'script.bat',
        'command.cmd',
        'virus.scr',
        'hack.vbs',
        'backdoor.php'
      ];

      suspiciousPaths.forEach(path => {
        expect(() => {
          InputValidator.validateFilePath(path);
        }).toThrow('Suspicious file extension detected');
      });
    });

    it('should reject empty or too long paths', () => {
      expect(() => {
        InputValidator.validateFilePath('');
      }).toThrow();

      const longPath = 'a'.repeat(501);
      expect(() => {
        InputValidator.validateFilePath(longPath);
      }).toThrow();
    });
  });

  describe('validateEmail', () => {
    it('should validate valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user+tag@domain.co.uk',
        'name@subdomain.example.org'
      ];

      validEmails.forEach(email => {
        const result = InputValidator.validateEmail(email);
        expect(result).toBeDefined();
        expect(result).toContain('@');
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user space@domain.com'
      ];

      invalidEmails.forEach(email => {
        expect(() => {
          InputValidator.validateEmail(email);
        }).toThrow();
      });
    });
  });

  describe('validateNumber', () => {
    it('should validate valid numbers', () => {
      const validNumbers = [
        { value: 42, expected: 42 },
        { value: '123', expected: 123 },
        { value: 0, expected: 0 },
        { value: 3.14, expected: 3.14 }
      ];

      validNumbers.forEach(({ value, expected }) => {
        const result = InputValidator.validateNumber(value);
        expect(result).toBe(expected);
      });
    });

    it('should validate numbers within range', () => {
      const result = InputValidator.validateNumber(50, 10, 100);
      expect(result).toBe(50);
    });

    it('should reject numbers outside range', () => {
      expect(() => {
        InputValidator.validateNumber(5, 10, 100);
      }).toThrow('Number must be between 10 and 100');

      expect(() => {
        InputValidator.validateNumber(150, 10, 100);
      }).toThrow('Number must be between 10 and 100');
    });

    it('should reject invalid number formats', () => {
      const invalidNumbers = [
        'not-a-number',
        NaN,
        Infinity,
        -Infinity,
        undefined,
        null,
        {}
      ];

      invalidNumbers.forEach(value => {
        expect(() => {
          InputValidator.validateNumber(value);
        }).toThrow();
      });
    });
  });

  describe('validateMultiple', () => {
    it('should validate multiple inputs successfully', () => {
      const inputs = {
        prompt: 'Hello world',
        apiKey: 'sk-1234567890abcdef1234567890abcdef',
        modelName: 'gpt-4'
      };

      const validators = {
        prompt: InputValidator.validatePrompt,
        apiKey: InputValidator.validateApiKey,
        modelName: InputValidator.validateModelName
      };

      const results = InputValidator.validateMultiple(inputs, validators);

      expect(results.prompt.isValid).toBe(true);
      expect(results.apiKey.isValid).toBe(true);
      expect(results.modelName.isValid).toBe(true);
    });

    it('should handle mixed validation results', () => {
      const inputs = {
        validPrompt: 'Hello world',
        invalidApiKey: 'invalid-key',
        validModelName: 'gpt-4'
      };

      const validators = {
        validPrompt: InputValidator.validatePrompt,
        invalidApiKey: InputValidator.validateApiKey,
        validModelName: InputValidator.validateModelName
      };

      const results = InputValidator.validateMultiple(inputs, validators);

      expect(results.validPrompt.isValid).toBe(true);
      expect(results.invalidApiKey.isValid).toBe(false);
      expect(results.validModelName.isValid).toBe(true);
    });

    it('should handle missing validators', () => {
      const inputs = {
        prompt: 'Hello world',
        missingValidator: 'test'
      };

      const validators = {
        prompt: InputValidator.validatePrompt
      };

      const results = InputValidator.validateMultiple(inputs, validators);

      expect(results.prompt.isValid).toBe(true);
      expect(results.missingValidator.isValid).toBe(false);
      expect(results.missingValidator.error).toContain('No validator found');
    });
  });

  describe('createValidationResult', () => {
    it('should create validation result with all properties', () => {
      const result = InputValidator.createValidationResult(true, 'test-value', 'test-error');

      expect(result.isValid).toBe(true);
      expect(result.value).toBe('test-value');
      expect(result.error).toBe('test-error');
    });

    it('should create validation result with minimal properties', () => {
      const result = InputValidator.createValidationResult(false);

      expect(result.isValid).toBe(false);
      expect(result.value).toBeUndefined();
      expect(result.error).toBeUndefined();
    });
  });
});