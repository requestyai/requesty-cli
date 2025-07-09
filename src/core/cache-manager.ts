import { ErrorHandler } from '../utils/error-handler';

/**
 * Cache manager for storing frequently accessed data
 * Provides TTL-based caching with automatic cleanup
 */
export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly defaultTTL: number = 300000; // 5 minutes
  private readonly cleanupFrequency: number = 60000; // 1 minute

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (optional)
   */
  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    try {
      const entry: CacheEntry = {
        data,
        expiry: Date.now() + ttl,
        created: Date.now(),
        accessed: Date.now(),
        accessCount: 1
      };

      this.cache.set(key, entry);
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Cache set operation');
    }
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */
  get(key: string): any | null {
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        return null;
      }

      if (entry.expiry < Date.now()) {
        this.cache.delete(key);
        return null;
      }

      // Update access tracking
      entry.accessed = Date.now();
      entry.accessCount++;

      return entry.data;
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Cache get operation');
    }
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key - Cache key
   * @returns True if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   * @param key - Cache key to delete
   * @returns True if key was deleted, false if not found
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set a value in the cache
   * @param key - Cache key
   * @param factory - Function to create the value if not cached
   * @param ttl - Time to live in milliseconds (optional)
   * @returns Cached or newly created value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    try {
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }

      const value = await factory();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      console.warn(`Cache error for key ${key}, executing factory directly`);
      return await factory();
    }
  }

  /**
   * Get or set a value in the cache (synchronous version)
   * @param key - Cache key
   * @param factory - Function to create the value if not cached
   * @param ttl - Time to live in milliseconds (optional)
   * @returns Cached or newly created value
   */
  getOrSetSync<T>(
    key: string,
    factory: () => T,
    ttl: number = this.defaultTTL
  ): T {
    try {
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }

      const value = factory();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Cache getOrSetSync operation');
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics object
   */
  getStats(): CacheStats {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    const validEntries = entries.filter(([_, entry]) => entry.expiry > now);
    const expiredEntries = entries.filter(([_, entry]) => entry.expiry <= now);

    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: expiredEntries.length,
      hitRate: this.calculateHitRate(validEntries.map(([_, entry]) => entry)),
      averageAge: this.calculateAverageAge(validEntries.map(([_, entry]) => entry)),
      memoryUsage: this.estimateMemoryUsage(),
      topKeys: this.getTopAccessedKeys(5)
    };
  }

  /**
   * Calculate hit rate based on access counts
   * @param entries - Array of valid cache entries
   * @returns Hit rate percentage
   */
  private calculateHitRate(entries: CacheEntry[]): number {
    if (entries.length === 0) return 0;
    
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const uniqueEntries = entries.length;
    
    return uniqueEntries > 0 ? (totalAccesses / uniqueEntries) : 0;
  }

  /**
   * Calculate average age of cache entries
   * @param entries - Array of valid cache entries
   * @returns Average age in milliseconds
   */
  private calculateAverageAge(entries: CacheEntry[]): number {
    if (entries.length === 0) return 0;
    
    const now = Date.now();
    const totalAge = entries.reduce((sum, entry) => sum + (now - entry.created), 0);
    
    return totalAge / entries.length;
  }

  /**
   * Estimate memory usage of cache
   * @returns Estimated memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16 encoding
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 64; // Overhead for entry object
    }
    
    return totalSize;
  }

  /**
   * Get the most accessed cache keys
   * @param limit - Number of top keys to return
   * @returns Array of top accessed keys with their access counts
   */
  private getTopAccessedKeys(limit: number): Array<{ key: string; accessCount: number }> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, accessCount: entry.accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
    
    return entries;
  }

  /**
   * Start the cleanup timer to remove expired entries
   */
  private startCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.cleanupFrequency);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Stop the cleanup timer
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

/**
 * Cache entry interface
 */
interface CacheEntry {
  data: any;
  expiry: number;
  created: number;
  accessed: number;
  accessCount: number;
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  hitRate: number;
  averageAge: number;
  memoryUsage: number;
  topKeys: Array<{ key: string; accessCount: number }>;
}

// Export singleton instance
export const cacheManager = new CacheManager();