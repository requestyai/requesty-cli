/**
 * Unit tests for Connection Pool
 */

import { ConnectionPool } from '../../core/connection-pool';
import { CLIConfig } from '../../core/types';
import { MockOpenAI } from '../mocks/openai';
import { TestUtils } from '../test-utils';

// Mock the OpenAI module
jest.mock('openai', () => ({
  OpenAI: MockOpenAI
}));

// Mock the OpenAI client factory
jest.mock('../../core/openai-client-factory', () => ({
  OpenAIClientFactory: {
    create: jest.fn().mockImplementation(() => new MockOpenAI({})),
    createSecure: jest.fn().mockImplementation(() => new MockOpenAI({}))
  }
}));

describe('ConnectionPool', () => {
  let pool: ConnectionPool;
  let mockConfig: CLIConfig;

  beforeEach(() => {
    pool = new ConnectionPool();
    mockConfig = TestUtils.createMockConfig();
  });

  afterEach(() => {
    pool.clear();
  });

  describe('getClient', () => {
    it('should create and return a new client', () => {
      const client = pool.getClient(mockConfig);
      
      expect(client).toBeInstanceOf(MockOpenAI);
    });

    it('should reuse existing client for same configuration', () => {
      const client1 = pool.getClient(mockConfig);
      const client2 = pool.getClient(mockConfig);
      
      expect(client1).toBe(client2);
    });

    it('should create different clients for different configurations', () => {
      const config1 = { ...mockConfig, baseURL: 'https://api1.test.com' };
      const config2 = { ...mockConfig, baseURL: 'https://api2.test.com' };
      
      const client1 = pool.getClient(config1);
      const client2 = pool.getClient(config2);
      
      expect(client1).not.toBe(client2);
    });

    it('should remove stale clients and create new ones', async () => {
      const client1 = pool.getClient(mockConfig);
      
      // Set a very short idle time for testing
      pool.setMaxIdleTime(1);
      
      // Wait for client to become stale
      await new Promise(resolve => setTimeout(resolve, 5));
      
      const client2 = pool.getClient(mockConfig);
      
      expect(client1).not.toBe(client2);
    });

    it('should evict least used client when pool is full', () => {
      pool.setMaxPoolSize(2);
      
      const config1 = { ...mockConfig, baseURL: 'https://api1.test.com' };
      const config2 = { ...mockConfig, baseURL: 'https://api2.test.com' };
      const config3 = { ...mockConfig, baseURL: 'https://api3.test.com' };
      
      const client1 = pool.getClient(config1);
      const client2 = pool.getClient(config2);
      
      // Use client2 more recently
      pool.getClient(config2);
      
      // Adding third client should evict client1
      const client3 = pool.getClient(config3);
      
      // Client1 should be evicted, so getting it again should create a new instance
      const newClient1 = pool.getClient(config1);
      expect(newClient1).not.toBe(client1);
    });
  });

  describe('getSecureClient', () => {
    it('should create and return a secure client', () => {
      const client = pool.getSecureClient(mockConfig);
      
      expect(client).toBeInstanceOf(MockOpenAI);
    });

    it('should create different clients for different additional headers', () => {
      const headers1 = { 'X-Security-Token': 'token1' };
      const headers2 = { 'X-Security-Token': 'token2' };
      
      const client1 = pool.getSecureClient(mockConfig, headers1);
      const client2 = pool.getSecureClient(mockConfig, headers2);
      
      expect(client1).not.toBe(client2);
    });

    it('should reuse secure clients with same headers', () => {
      const headers = { 'X-Security-Token': 'token1' };
      
      const client1 = pool.getSecureClient(mockConfig, headers);
      const client2 = pool.getSecureClient(mockConfig, headers);
      
      expect(client1).toBe(client2);
    });

    it('should create secure client without additional headers', () => {
      const client = pool.getSecureClient(mockConfig);
      
      expect(client).toBeInstanceOf(MockOpenAI);
    });
  });

  describe('getStats', () => {
    it('should return correct pool statistics', () => {
      const config1 = { ...mockConfig, baseURL: 'https://api1.test.com' };
      const config2 = { ...mockConfig, baseURL: 'https://api2.test.com' };
      
      pool.getClient(config1);
      pool.getClient(config2);
      pool.getClient(config1); // Use config1 again
      
      const stats = pool.getStats();
      
      expect(stats.totalConnections).toBe(2);
      expect(stats.activeConnections).toBe(2);
      expect(stats.totalUsage).toBe(3);
      expect(stats.connections).toHaveLength(2);
    });

    it('should return empty stats for empty pool', () => {
      const stats = pool.getStats();
      
      expect(stats.totalConnections).toBe(0);
      expect(stats.activeConnections).toBe(0);
      expect(stats.totalUsage).toBe(0);
      expect(stats.connections).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should clear all connections', () => {
      pool.getClient(mockConfig);
      
      expect(pool.getStats().totalConnections).toBe(1);
      
      pool.clear();
      
      expect(pool.getStats().totalConnections).toBe(0);
    });
  });

  describe('setMaxPoolSize', () => {
    it('should set maximum pool size', () => {
      pool.setMaxPoolSize(5);
      
      const stats = pool.getStats();
      expect(stats.maxPoolSize).toBe(5);
    });

    it('should evict excess connections when size is reduced', () => {
      const config1 = { ...mockConfig, baseURL: 'https://api1.test.com' };
      const config2 = { ...mockConfig, baseURL: 'https://api2.test.com' };
      const config3 = { ...mockConfig, baseURL: 'https://api3.test.com' };
      
      pool.getClient(config1);
      pool.getClient(config2);
      pool.getClient(config3);
      
      expect(pool.getStats().totalConnections).toBe(3);
      
      pool.setMaxPoolSize(2);
      
      expect(pool.getStats().totalConnections).toBe(2);
    });
  });

  describe('setMaxIdleTime', () => {
    it('should set maximum idle time', () => {
      pool.setMaxIdleTime(60000);
      
      // Test by creating a client and checking it's still valid
      const client = pool.getClient(mockConfig);
      expect(client).toBeInstanceOf(MockOpenAI);
    });
  });

  describe('key generation', () => {
    it('should generate different keys for different configurations', () => {
      const config1 = { ...mockConfig, baseURL: 'https://api1.test.com' };
      const config2 = { ...mockConfig, baseURL: 'https://api2.test.com' };
      
      pool.getClient(config1);
      pool.getClient(config2);
      
      const stats = pool.getStats();
      expect(stats.connections).toHaveLength(2);
      
      const keys = stats.connections.map(c => c.key);
      expect(keys[0]).not.toBe(keys[1]);
    });

    it('should generate same key for same configuration', () => {
      const client1 = pool.getClient(mockConfig);
      const client2 = pool.getClient(mockConfig);
      
      expect(client1).toBe(client2);
      
      const stats = pool.getStats();
      expect(stats.connections).toHaveLength(1);
    });
  });

  describe('usage tracking', () => {
    it('should track client usage correctly', () => {
      const client = pool.getClient(mockConfig);
      
      // Use client multiple times
      pool.getClient(mockConfig);
      pool.getClient(mockConfig);
      
      const stats = pool.getStats();
      expect(stats.totalUsage).toBe(3);
      expect(stats.connections[0].usage).toBe(3);
    });

    it('should track last used time', () => {
      const beforeTime = Date.now();
      pool.getClient(mockConfig);
      const afterTime = Date.now();
      
      const stats = pool.getStats();
      const lastUsed = stats.connections[0].lastUsed;
      
      expect(lastUsed).toBeGreaterThanOrEqual(beforeTime);
      expect(lastUsed).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('error handling', () => {
    it('should handle client creation errors', () => {
      const { OpenAIClientFactory } = require('../../core/openai-client-factory');
      OpenAIClientFactory.create.mockImplementationOnce(() => {
        throw new Error('Client creation failed');
      });
      
      expect(() => {
        pool.getClient(mockConfig);
      }).toThrow('Connection pool client creation: Client creation failed');
    });

    it('should handle secure client creation errors', () => {
      const { OpenAIClientFactory } = require('../../core/openai-client-factory');
      OpenAIClientFactory.createSecure.mockImplementationOnce(() => {
        throw new Error('Secure client creation failed');
      });
      
      expect(() => {
        pool.getSecureClient(mockConfig);
      }).toThrow('Secure connection pool client creation: Secure client creation failed');
    });
  });
});