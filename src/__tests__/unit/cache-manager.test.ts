/**
 * Unit tests for Cache Manager
 */

import { CacheManager } from '../../core/cache-manager';
import { TestUtils } from '../test-utils';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
  });

  afterEach(() => {
    cacheManager.destroy();
  });

  describe('set and get', () => {
    it('should set and get cached values', () => {
      const key = 'test-key';
      const data = { message: 'Hello, World!' };
      
      cacheManager.set(key, data);
      const result = cacheManager.get(key);
      
      expect(result).toEqual(data);
    });

    it('should return null for non-existent keys', () => {
      const result = cacheManager.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should return null for expired entries', async () => {
      const key = 'expire-test';
      const data = 'test data';
      const shortTTL = 10; // 10ms
      
      cacheManager.set(key, data, shortTTL);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const result = cacheManager.get(key);
      expect(result).toBeNull();
    });

    it('should update access tracking on get', () => {
      const key = 'access-test';
      const data = 'test data';
      
      cacheManager.set(key, data);
      
      // Get multiple times to test access tracking
      cacheManager.get(key);
      cacheManager.get(key);
      
      const stats = cacheManager.getStats();
      const topKeys = stats.topKeys;
      
      expect(topKeys).toHaveLength(1);
      expect(topKeys[0].key).toBe(key);
      expect(topKeys[0].accessCount).toBe(3); // 1 from set + 2 from gets
    });
  });

  describe('has', () => {
    it('should return true for existing valid entries', () => {
      const key = 'test-key';
      const data = 'test data';
      
      cacheManager.set(key, data);
      
      expect(cacheManager.has(key)).toBe(true);
    });

    it('should return false for non-existent entries', () => {
      expect(cacheManager.has('non-existent')).toBe(false);
    });

    it('should return false for expired entries', async () => {
      const key = 'expire-test';
      const data = 'test data';
      const shortTTL = 10; // 10ms
      
      cacheManager.set(key, data, shortTTL);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));
      
      expect(cacheManager.has(key)).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing entries', () => {
      const key = 'delete-test';
      const data = 'test data';
      
      cacheManager.set(key, data);
      expect(cacheManager.has(key)).toBe(true);
      
      const deleted = cacheManager.delete(key);
      expect(deleted).toBe(true);
      expect(cacheManager.has(key)).toBe(false);
    });

    it('should return false for non-existent entries', () => {
      const deleted = cacheManager.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cached data', () => {
      cacheManager.set('key1', 'data1');
      cacheManager.set('key2', 'data2');
      
      expect(cacheManager.has('key1')).toBe(true);
      expect(cacheManager.has('key2')).toBe(true);
      
      cacheManager.clear();
      
      expect(cacheManager.has('key1')).toBe(false);
      expect(cacheManager.has('key2')).toBe(false);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const key = 'cached-key';
      const cachedData = 'cached data';
      const factoryData = 'factory data';
      
      cacheManager.set(key, cachedData);
      
      const factory = jest.fn().mockResolvedValue(factoryData);
      const result = await cacheManager.getOrSet(key, factory);
      
      expect(result).toBe(cachedData);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not exists', async () => {
      const key = 'new-key';
      const factoryData = 'factory data';
      
      const factory = jest.fn().mockResolvedValue(factoryData);
      const result = await cacheManager.getOrSet(key, factory);
      
      expect(result).toBe(factoryData);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cacheManager.get(key)).toBe(factoryData);
    });

    it('should handle factory errors', async () => {
      const key = 'error-key';
      const factory = jest.fn().mockRejectedValue(new Error('Factory error'));
      
      await expect(cacheManager.getOrSet(key, factory)).rejects.toThrow('Factory error');
    });
  });

  describe('getOrSetSync', () => {
    it('should return cached value if exists', () => {
      const key = 'cached-key';
      const cachedData = 'cached data';
      const factoryData = 'factory data';
      
      cacheManager.set(key, cachedData);
      
      const factory = jest.fn().mockReturnValue(factoryData);
      const result = cacheManager.getOrSetSync(key, factory);
      
      expect(result).toBe(cachedData);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not exists', () => {
      const key = 'new-key';
      const factoryData = 'factory data';
      
      const factory = jest.fn().mockReturnValue(factoryData);
      const result = cacheManager.getOrSetSync(key, factory);
      
      expect(result).toBe(factoryData);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cacheManager.get(key)).toBe(factoryData);
    });

    it('should handle factory errors', () => {
      const key = 'error-key';
      const factory = jest.fn().mockImplementation(() => {
        throw new Error('Factory error');
      });
      
      expect(() => {
        cacheManager.getOrSetSync(key, factory);
      }).toThrow('Factory error');
    });
  });

  describe('getStats', () => {
    it('should return accurate cache statistics', () => {
      const key1 = 'key1';
      const key2 = 'key2';
      const key3 = 'expired-key';
      
      cacheManager.set(key1, 'data1');
      cacheManager.set(key2, 'data2');
      cacheManager.set(key3, 'data3', 1); // Very short TTL
      
      // Access some keys
      cacheManager.get(key1);
      cacheManager.get(key1);
      cacheManager.get(key2);
      
      const stats = cacheManager.getStats();
      
      expect(stats.totalEntries).toBe(3);
      expect(stats.validEntries).toBe(2); // key3 should be expired
      expect(stats.expiredEntries).toBe(1);
      expect(stats.topKeys).toHaveLength(2);
      expect(stats.topKeys[0].key).toBe(key1); // Most accessed
      expect(stats.topKeys[0].accessCount).toBe(3); // 1 from set + 2 from gets
    });

    it('should return empty stats for empty cache', () => {
      const stats = cacheManager.getStats();
      
      expect(stats.totalEntries).toBe(0);
      expect(stats.validEntries).toBe(0);
      expect(stats.expiredEntries).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.averageAge).toBe(0);
      expect(stats.topKeys).toHaveLength(0);
    });

    it('should calculate hit rate correctly', () => {
      const key1 = 'key1';
      const key2 = 'key2';
      
      cacheManager.set(key1, 'data1');
      cacheManager.set(key2, 'data2');
      
      // Access key1 multiple times
      cacheManager.get(key1);
      cacheManager.get(key1);
      cacheManager.get(key1);
      
      const stats = cacheManager.getStats();
      
      // Hit rate should be total accesses / unique entries
      expect(stats.hitRate).toBe(3); // (4 + 1) / 2 = 2.5, but key1 has 4 accesses, key2 has 1
    });
  });

  describe('automatic cleanup', () => {
    it('should automatically remove expired entries', async () => {
      const key = 'auto-expire-test';
      const data = 'test data';
      const shortTTL = 50; // 50ms
      
      cacheManager.set(key, data, shortTTL);
      
      expect(cacheManager.has(key)).toBe(true);
      
      // Wait for cleanup cycle (default is 60s, but we'll wait longer than TTL)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Manual cleanup for testing
      cacheManager['cleanup']();
      
      expect(cacheManager.has(key)).toBe(false);
    });
  });

  describe('memory estimation', () => {
    it('should estimate memory usage', () => {
      const key1 = 'test-key-1';
      const key2 = 'test-key-2';
      const data1 = 'small data';
      const data2 = { large: 'data'.repeat(1000) };
      
      cacheManager.set(key1, data1);
      cacheManager.set(key2, data2);
      
      const stats = cacheManager.getStats();
      
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(typeof stats.memoryUsage).toBe('number');
    });
  });

  describe('TTL handling', () => {
    it('should use default TTL when not specified', () => {
      const key = 'default-ttl-test';
      const data = 'test data';
      
      cacheManager.set(key, data);
      
      // Should be accessible immediately
      expect(cacheManager.get(key)).toBe(data);
    });

    it('should respect custom TTL', async () => {
      const key = 'custom-ttl-test';
      const data = 'test data';
      const customTTL = 25; // 25ms
      
      cacheManager.set(key, data, customTTL);
      
      // Should be accessible immediately
      expect(cacheManager.get(key)).toBe(data);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(cacheManager.get(key)).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should stop cleanup timer and clear cache', () => {
      cacheManager.set('test-key', 'test-data');
      
      expect(cacheManager.has('test-key')).toBe(true);
      
      cacheManager.destroy();
      
      expect(cacheManager.has('test-key')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully in set operation', () => {
      // Mock Date.now to potentially cause issues
      const originalDateNow = Date.now;
      jest.spyOn(Date, 'now').mockImplementation(() => {
        throw new Error('Date.now error');
      });
      
      expect(() => {
        cacheManager.set('error-key', 'data');
      }).toThrow('Cache set operation: Date.now error');
      
      Date.now = originalDateNow;
    });

    it('should handle errors gracefully in get operation', () => {
      // Set up a normal entry first
      cacheManager.set('test-key', 'test-data');
      
      // Mock Date.now to cause issues during get
      const originalDateNow = Date.now;
      jest.spyOn(Date, 'now').mockImplementation(() => {
        throw new Error('Date.now error');
      });
      
      expect(() => {
        cacheManager.get('test-key');
      }).toThrow('Cache get operation: Date.now error');
      
      Date.now = originalDateNow;
    });
  });
});