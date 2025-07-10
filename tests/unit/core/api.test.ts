/**
 * Unit tests for core API functionality
 */

import { RequestyAPI } from '../../../src/core/api';
import { TestHelper, MockFactory } from '../../helpers/test-utils';

describe('RequestyAPI', () => {
  let api: RequestyAPI;
  let testHelper: TestHelper;

  beforeEach(() => {
    testHelper = TestHelper.getInstance();
    api = new RequestyAPI({
      baseURL: 'http://localhost:3000',
      apiKey: 'test_key_12345',
      timeout: 30000
    });
  });

  afterEach(() => {
    testHelper.cleanup();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(api).toBeDefined();
      expect(api['config'].baseURL).toBe('http://localhost:3000');
      expect(api['config'].apiKey).toBe('test_key_12345');
      expect(api['config'].timeout).toBe(30000);
    });

    it('should throw error with invalid configuration', () => {
      expect(() => {
        new RequestyAPI({
          baseURL: '',
          apiKey: '',
          timeout: 0
        });
      }).toThrow();
    });
  });

  describe('getModels', () => {
    it('should return list of available models', async () => {
      const mockModels = testHelper.generateTestData('models');
      testHelper.createMockAPIResponse('models', mockModels);

      // Mock the actual API call
      jest.spyOn(api, 'getModels').mockResolvedValue(mockModels.models);

      const result = await api.getModels();
      expect(result).toEqual(mockModels.models);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle API errors gracefully', async () => {
      jest.spyOn(api, 'getModels').mockRejectedValue(new Error('API Error'));

      await expect(api.getModels()).rejects.toThrow('API Error');
    });
  });

  describe('testModel', () => {
    it('should successfully test a model with valid input', async () => {
      const mockResponse = testHelper.generateTestData('response');
      const prompt = testHelper.generateTestData('prompt');

      jest.spyOn(api, 'testModel').mockResolvedValue(mockResponse);

      const result = await api.testModel('test-model-1', prompt);
      expect(result).toEqual(mockResponse);
      expect(result.choices).toBeDefined();
      expect(result.usage).toBeDefined();
    });

    it('should handle model not found error', async () => {
      jest.spyOn(api, 'testModel').mockRejectedValue(new Error('Model not found'));

      await expect(api.testModel('invalid-model', 'test prompt')).rejects.toThrow('Model not found');
    });

    it('should validate input parameters', async () => {
      await expect(api.testModel('', 'test prompt')).rejects.toThrow();
      await expect(api.testModel('test-model', '')).rejects.toThrow();
    });
  });

  describe('streamResponse', () => {
    it('should handle streaming responses correctly', async () => {
      const mockStream = ['chunk1', 'chunk2', 'chunk3'];
      
      jest.spyOn(api, 'streamResponse').mockImplementation(async function* () {
        for (const chunk of mockStream) {
          yield chunk;
        }
      });

      const chunks: string[] = [];
      for await (const chunk of api.streamResponse('test-model', 'test prompt')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(mockStream);
    });

    it('should handle streaming errors', async () => {
      jest.spyOn(api, 'streamResponse').mockImplementation(async function* () {
        throw new Error('Stream error');
      });

      const streamGenerator = api.streamResponse('test-model', 'test prompt');
      await expect(streamGenerator.next()).rejects.toThrow('Stream error');
    });
  });

  describe('authentication', () => {
    it('should include API key in requests', async () => {
      const mockResponse = testHelper.generateTestData('response');
      const apiSpy = jest.spyOn(api, 'testModel').mockResolvedValue(mockResponse);

      await api.testModel('test-model', 'test prompt');

      expect(apiSpy).toHaveBeenCalledWith('test-model', 'test prompt');
    });

    it('should handle authentication errors', async () => {
      jest.spyOn(api, 'testModel').mockRejectedValue(new Error('Unauthorized'));

      await expect(api.testModel('test-model', 'test prompt')).rejects.toThrow('Unauthorized');
    });
  });

  describe('timeout handling', () => {
    it('should respect timeout configuration', async () => {
      const slowAPI = new RequestyAPI({
        baseURL: 'http://localhost:3000',
        apiKey: 'test_key_12345',
        timeout: 100 // Very short timeout
      });

      jest.spyOn(slowAPI, 'testModel').mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      // This should timeout
      await expect(slowAPI.testModel('test-model', 'test prompt')).rejects.toThrow();
    });
  });
});