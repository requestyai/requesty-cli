/**
 * Unit tests for Error Handler
 */

import { ErrorHandler } from '../../utils/error-handler';
import { TestUtils } from '../test-utils';

describe('ErrorHandler', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('handleApiError', () => {
    it('should throw formatted error for Error objects', () => {
      const originalError = new Error('API connection failed');
      const context = 'OpenAI API call';

      expect(() => {
        ErrorHandler.handleApiError(originalError, context);
      }).toThrow('OpenAI API call: API connection failed');
    });

    it('should throw formatted error for string errors', () => {
      const originalError = 'Network timeout';
      const context = 'Request processing';

      expect(() => {
        ErrorHandler.handleApiError(originalError, context);
      }).toThrow('Request processing: Unknown error');
    });

    it('should throw formatted error for unknown error types', () => {
      const originalError = { code: 500, message: 'Internal server error' };
      const context = 'API validation';

      expect(() => {
        ErrorHandler.handleApiError(originalError, context);
      }).toThrow('API validation: Unknown error');
    });
  });

  describe('handleSecurityError', () => {
    it('should log security error and throw formatted error', () => {
      const originalError = new Error('Invalid API key');
      const context = 'Authentication';

      expect(() => {
        ErrorHandler.handleSecurityError(originalError, context);
      }).toThrow('Security error in Authentication: Invalid API key');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SECURITY] Authentication: Invalid API key'
      );
    });

    it('should sanitize sensitive error messages', () => {
      const originalError = new Error('Password: secret123');
      const context = 'Key validation';

      expect(() => {
        ErrorHandler.handleSecurityError(originalError, context, true);
      }).toThrow('Security error in Key validation: Sensitive operation failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SECURITY] Key validation: Sensitive operation failed'
      );
    });

    it('should handle non-Error objects', () => {
      const originalError = 'Security violation';
      const context = 'Input validation';

      expect(() => {
        ErrorHandler.handleSecurityError(originalError, context);
      }).toThrow('Security error in Input validation: Security error occurred');
    });
  });

  describe('handleValidationError', () => {
    it('should throw formatted validation error with value', () => {
      const originalError = new Error('String too long');
      const field = 'username';
      const value = 'a'.repeat(100);

      expect(() => {
        ErrorHandler.handleValidationError(originalError, field, value);
      }).toThrow('Validation error for username: String too long (value: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa)');
    });

    it('should handle complex values', () => {
      const originalError = new Error('Invalid format');
      const field = 'config';
      const value = { username: 'test', password: 'secret' };

      expect(() => {
        ErrorHandler.handleValidationError(originalError, field, value);
      }).toThrow('Validation error for config: Invalid format (value: [complex value])');
    });

    it('should handle validation without value', () => {
      const originalError = new Error('Required field missing');
      const field = 'email';

      expect(() => {
        ErrorHandler.handleValidationError(originalError, field);
      }).toThrow('Validation error for email: Required field missing (value: undefined)');
    });
  });

  describe('handleFileError', () => {
    it('should throw formatted file error with sanitized path', () => {
      const originalError = new Error('File not found');
      const operation = 'read';
      const path = '/home/user/documents/secret.txt';

      expect(() => {
        ErrorHandler.handleFileError(originalError, operation, path);
      }).toThrow('File read failed at /home/user/documents/[filename]: File not found');
    });

    it('should handle Windows paths', () => {
      const originalError = new Error('Permission denied');
      const operation = 'write';
      const path = 'C:\\Users\\Test\\Documents\\file.txt';

      expect(() => {
        ErrorHandler.handleFileError(originalError, operation, path);
      }).toThrow('File write failed at C:\\Users\\Test\\Documents\\[filename]: Permission denied');
    });

    it('should handle non-Error objects', () => {
      const originalError = 'IO error';
      const operation = 'delete';
      const path = '/tmp/test.txt';

      expect(() => {
        ErrorHandler.handleFileError(originalError, operation, path);
      }).toThrow('File delete failed at /tmp/[filename]: File operation failed');
    });
  });

  describe('handleStreamingError', () => {
    it('should throw formatted streaming error', () => {
      const originalError = new Error('Connection lost');
      const streamId = 'stream-123';
      const stage = 'processing';

      expect(() => {
        ErrorHandler.handleStreamingError(originalError, streamId, stage);
      }).toThrow('Streaming error in processing for stream stream-123: Connection lost');
    });

    it('should handle non-Error objects', () => {
      const originalError = 'Stream timeout';
      const streamId = 'stream-456';
      const stage = 'initialization';

      expect(() => {
        ErrorHandler.handleStreamingError(originalError, streamId, stage);
      }).toThrow('Streaming error in initialization for stream stream-456: Streaming error');
    });
  });

  describe('wrapAsync', () => {
    it('should return result for successful operations', async () => {
      const operation = async () => 'success';
      const result = await ErrorHandler.wrapAsync(operation, 'test operation');
      
      expect(result).toBe('success');
    });

    it('should throw formatted error for failed operations', async () => {
      const operation = async () => {
        throw new Error('Operation failed');
      };

      await expect(
        ErrorHandler.wrapAsync(operation, 'test operation')
      ).rejects.toThrow('test operation: Operation failed');
    });

    it('should handle non-Error rejections', async () => {
      const operation = async () => {
        throw 'String error';
      };

      await expect(
        ErrorHandler.wrapAsync(operation, 'test operation')
      ).rejects.toThrow('test operation: Unknown error');
    });
  });

  describe('wrapSync', () => {
    it('should return result for successful operations', () => {
      const operation = () => 'success';
      const result = ErrorHandler.wrapSync(operation, 'test operation');
      
      expect(result).toBe('success');
    });

    it('should throw formatted error for failed operations', () => {
      const operation = () => {
        throw new Error('Operation failed');
      };

      expect(() => {
        ErrorHandler.wrapSync(operation, 'test operation');
      }).toThrow('test operation: Operation failed');
    });

    it('should handle non-Error exceptions', () => {
      const operation = () => {
        throw 'String error';
      };

      expect(() => {
        ErrorHandler.wrapSync(operation, 'test operation');
      }).toThrow('test operation: Unknown error');
    });
  });
});