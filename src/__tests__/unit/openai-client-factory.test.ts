/**
 * Unit tests for OpenAI Client Factory
 */

import { OpenAIClientFactory } from '../../core/openai-client-factory';
import { CLIConfig } from '../../core/types';
import { MockOpenAI } from '../mocks/openai';

// Mock the OpenAI module
jest.mock('openai', () => ({
  OpenAI: MockOpenAI
}));

describe('OpenAIClientFactory', () => {
  let mockConfig: CLIConfig;

  beforeEach(() => {
    mockConfig = {
      baseURL: 'https://api.test.com',
      apiKey: 'test-api-key-123',
      timeout: 30000
    };
  });

  describe('create', () => {
    it('should create a new OpenAI client with correct configuration', () => {
      const client = OpenAIClientFactory.create(mockConfig);
      
      expect(client).toBeInstanceOf(MockOpenAI);
      expect(MockOpenAI).toHaveBeenCalledWith({
        baseURL: mockConfig.baseURL,
        apiKey: mockConfig.apiKey,
        timeout: mockConfig.timeout,
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/requestyai/requesty-cli',
          'X-Title': 'requesty-cli',
          'User-Agent': 'requesty-cli/2.0.0'
        }
      });
    });

    it('should use default API key if not provided', () => {
      const configWithoutKey = { ...mockConfig, apiKey: undefined };
      OpenAIClientFactory.create(configWithoutKey);
      
      expect(MockOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: '<REQUESTY_API_KEY>'
        })
      );
    });

    it('should use default timeout if not provided', () => {
      const configWithoutTimeout = { ...mockConfig, timeout: undefined };
      OpenAIClientFactory.create(configWithoutTimeout);
      
      expect(MockOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000
        })
      );
    });
  });

  describe('createSecure', () => {
    it('should create a secure OpenAI client with enhanced headers', () => {
      const additionalHeaders = {
        'X-Security-Token': 'secure-token-123',
        'X-Request-ID': 'req-123'
      };
      
      const client = OpenAIClientFactory.createSecure(mockConfig, additionalHeaders);
      
      expect(client).toBeInstanceOf(MockOpenAI);
      expect(MockOpenAI).toHaveBeenCalledWith({
        baseURL: mockConfig.baseURL,
        apiKey: mockConfig.apiKey,
        timeout: mockConfig.timeout,
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/requestyai/requesty-cli',
          'X-Title': 'requesty-cli',
          'User-Agent': 'requesty-cli/2.0.0-secure',
          'X-Security-Token': 'secure-token-123',
          'X-Request-ID': 'req-123'
        }
      });
    });

    it('should create secure client without additional headers', () => {
      const client = OpenAIClientFactory.createSecure(mockConfig);
      
      expect(client).toBeInstanceOf(MockOpenAI);
      expect(MockOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultHeaders: expect.objectContaining({
            'User-Agent': 'requesty-cli/2.0.0-secure'
          })
        })
      );
    });

    it('should override default headers with additional headers', () => {
      const additionalHeaders = {
        'User-Agent': 'custom-user-agent',
        'X-Title': 'custom-title'
      };
      
      OpenAIClientFactory.createSecure(mockConfig, additionalHeaders);
      
      expect(MockOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultHeaders: expect.objectContaining({
            'User-Agent': 'requesty-cli/2.0.0-secure', // Should still be overridden by secure version
            'X-Title': 'custom-title'
          })
        })
      );
    });
  });

  describe('constants', () => {
    it('should have correct default values', () => {
      // Access private constants through the class behavior
      const client = OpenAIClientFactory.create({
        baseURL: 'https://test.com',
        apiKey: 'test'
      });
      
      expect(MockOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000
        })
      );
    });
  });
});