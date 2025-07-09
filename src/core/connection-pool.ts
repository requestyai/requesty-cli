import { OpenAI } from 'openai';
import { CLIConfig } from './types';
import { OpenAIClientFactory } from './openai-client-factory';
import { ErrorHandler } from '../utils/error-handler';

/**
 * Connection pool for managing OpenAI client instances
 * Provides connection reuse and resource optimization
 */
export class ConnectionPool {
  private pool: Map<string, OpenAI> = new Map();
  private usage: Map<string, number> = new Map();
  private maxPoolSize: number = 10;
  private maxIdleTime: number = 300000; // 5 minutes
  private lastUsed: Map<string, number> = new Map();

  /**
   * Get or create an OpenAI client for the given configuration
   * @param config - Configuration for the client
   * @returns OpenAI client instance
   */
  getClient(config: CLIConfig): OpenAI {
    const key = this.generateKey(config);
    
    try {
      // Check if client exists and is still valid
      if (this.pool.has(key)) {
        const lastUsedTime = this.lastUsed.get(key) || 0;
        if (Date.now() - lastUsedTime < this.maxIdleTime) {
          this.updateUsage(key);
          return this.pool.get(key)!;
        } else {
          // Client is stale, remove it
          this.removeClient(key);
        }
      }

      // Create new client if pool isn't full
      if (this.pool.size >= this.maxPoolSize) {
        this.evictLeastUsed();
      }

      const client = OpenAIClientFactory.create(config);
      this.pool.set(key, client);
      this.updateUsage(key);
      
      return client;
    } catch (error) {
      console.warn('Connection pool error, creating direct client');
      return OpenAIClientFactory.create(config);
    }
  }

  /**
   * Get a secure client for the given configuration
   * @param config - Configuration for the client
   * @param additionalHeaders - Additional security headers
   * @returns Secure OpenAI client instance
   */
  getSecureClient(config: CLIConfig, additionalHeaders: Record<string, string> = {}): OpenAI {
    const key = this.generateSecureKey(config, additionalHeaders);
    
    try {
      if (this.pool.has(key)) {
        const lastUsedTime = this.lastUsed.get(key) || 0;
        if (Date.now() - lastUsedTime < this.maxIdleTime) {
          this.updateUsage(key);
          return this.pool.get(key)!;
        } else {
          this.removeClient(key);
        }
      }

      if (this.pool.size >= this.maxPoolSize) {
        this.evictLeastUsed();
      }

      const client = OpenAIClientFactory.createSecure(config, additionalHeaders);
      this.pool.set(key, client);
      this.updateUsage(key);
      
      return client;
    } catch (error) {
      ErrorHandler.handleSecurityError(error, 'Secure connection pool client creation');
    }
  }

  /**
   * Generate a unique key for the client configuration
   * @param config - Configuration object
   * @returns Unique key string
   */
  private generateKey(config: CLIConfig): string {
    return `${config.baseURL}-${config.apiKey}-${config.timeout}`;
  }

  /**
   * Generate a unique key for secure client configuration
   * @param config - Configuration object
   * @param additionalHeaders - Additional headers
   * @returns Unique key string
   */
  private generateSecureKey(config: CLIConfig, additionalHeaders: Record<string, string>): string {
    const headersHash = Object.keys(additionalHeaders).sort().join(',');
    return `secure-${this.generateKey(config)}-${headersHash}`;
  }

  /**
   * Update usage tracking for a client
   * @param key - Client key
   */
  private updateUsage(key: string): void {
    this.usage.set(key, (this.usage.get(key) || 0) + 1);
    this.lastUsed.set(key, Date.now());
  }

  /**
   * Remove a client from the pool
   * @param key - Client key to remove
   */
  private removeClient(key: string): void {
    this.pool.delete(key);
    this.usage.delete(key);
    this.lastUsed.delete(key);
  }

  /**
   * Evict the least recently used client
   */
  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastUsedTime = Infinity;

    for (const [key, lastUsedTime] of this.lastUsed.entries()) {
      if (lastUsedTime < leastUsedTime) {
        leastUsedTime = lastUsedTime;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.removeClient(leastUsedKey);
    }
  }

  /**
   * Get pool statistics
   * @returns Pool statistics object
   */
  getStats(): ConnectionPoolStats {
    const totalUsage = Array.from(this.usage.values()).reduce((sum, count) => sum + count, 0);
    
    return {
      totalConnections: this.pool.size,
      maxPoolSize: this.maxPoolSize,
      totalUsage,
      activeConnections: this.pool.size,
      connections: Array.from(this.pool.keys()).map(key => ({
        key,
        usage: this.usage.get(key) || 0,
        lastUsed: this.lastUsed.get(key) || 0
      }))
    };
  }

  /**
   * Clear all connections from the pool
   */
  clear(): void {
    this.pool.clear();
    this.usage.clear();
    this.lastUsed.clear();
  }

  /**
   * Set the maximum pool size
   * @param size - Maximum number of connections to pool
   */
  setMaxPoolSize(size: number): void {
    this.maxPoolSize = size;
    
    // Evict excess connections if necessary
    while (this.pool.size > this.maxPoolSize) {
      this.evictLeastUsed();
    }
  }

  /**
   * Set the maximum idle time for connections
   * @param time - Maximum idle time in milliseconds
   */
  setMaxIdleTime(time: number): void {
    this.maxIdleTime = time;
  }
}

/**
 * Connection pool statistics interface
 */
export interface ConnectionPoolStats {
  totalConnections: number;
  maxPoolSize: number;
  totalUsage: number;
  activeConnections: number;
  connections: Array<{
    key: string;
    usage: number;
    lastUsed: number;
  }>;
}

// Export singleton instance
export const connectionPool = new ConnectionPool();