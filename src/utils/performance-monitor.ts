/**
 * Performance monitoring utility to eliminate duplicate timing patterns
 * Used across RequestyAPI.testModel, StreamingClient.streamCompletion, and SecureApiClient.secureRequest
 */
export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map();
  private static metrics: Map<string, PerformanceMetrics> = new Map();

  /**
   * Start a performance measurement
   * @param operationId - Unique identifier for the operation
   * @returns The start time timestamp
   */
  static startMeasurement(operationId: string): number {
    const startTime = Date.now();
    this.measurements.set(operationId, startTime);
    return startTime;
  }

  /**
   * End a performance measurement and calculate duration
   * @param operationId - Unique identifier for the operation
   * @returns Duration in milliseconds
   */
  static endMeasurement(operationId: string): number {
    const startTime = this.measurements.get(operationId);
    if (!startTime) {
      throw new Error(`No measurement found for operation: ${operationId}`);
    }
    
    const duration = Date.now() - startTime;
    this.measurements.delete(operationId);
    return duration;
  }

  /**
   * Measure an async operation and return both result and duration
   * @param operation - The async operation to measure
   * @param operationName - Name for the operation
   * @returns Object containing result and duration
   */
  static async measureAsync<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = this.startMeasurement(operationName);
    
    try {
      const result = await operation();
      const duration = this.endMeasurement(operationName);
      
      this.updateMetrics(operationName, duration, true);
      
      return { result, duration };
    } catch (error) {
      const duration = this.endMeasurement(operationName);
      this.updateMetrics(operationName, duration, false);
      throw error;
    }
  }

  /**
   * Measure a sync operation and return both result and duration
   * @param operation - The sync operation to measure
   * @param operationName - Name for the operation
   * @returns Object containing result and duration
   */
  static measureSync<T>(
    operation: () => T,
    operationName: string
  ): { result: T; duration: number } {
    const startTime = this.startMeasurement(operationName);
    
    try {
      const result = operation();
      const duration = this.endMeasurement(operationName);
      
      this.updateMetrics(operationName, duration, true);
      
      return { result, duration };
    } catch (error) {
      const duration = this.endMeasurement(operationName);
      this.updateMetrics(operationName, duration, false);
      throw error;
    }
  }

  /**
   * Update performance metrics for an operation
   * @param operationName - Name of the operation
   * @param duration - Duration in milliseconds
   * @param success - Whether the operation succeeded
   */
  private static updateMetrics(operationName: string, duration: number, success: boolean): void {
    const existing = this.metrics.get(operationName) || {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalDuration: 0,
      averageDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      lastCall: 0
    };

    existing.totalCalls++;
    existing.totalDuration += duration;
    existing.averageDuration = existing.totalDuration / existing.totalCalls;
    existing.minDuration = Math.min(existing.minDuration, duration);
    existing.maxDuration = Math.max(existing.maxDuration, duration);
    existing.lastCall = Date.now();

    if (success) {
      existing.successfulCalls++;
    } else {
      existing.failedCalls++;
    }

    this.metrics.set(operationName, existing);
  }

  /**
   * Get performance metrics for a specific operation
   * @param operationName - Name of the operation
   * @returns Performance metrics or undefined if not found
   */
  static getMetrics(operationName: string): PerformanceMetrics | undefined {
    return this.metrics.get(operationName);
  }

  /**
   * Get all performance metrics
   * @returns Map of all performance metrics
   */
  static getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Reset all performance metrics
   */
  static resetMetrics(): void {
    this.metrics.clear();
    this.measurements.clear();
  }

  /**
   * Get a performance summary report
   * @returns Formatted performance report
   */
  static getReport(): string {
    const report = ['Performance Report', '================'];
    
    for (const [operation, metrics] of this.metrics.entries()) {
      const successRate = (metrics.successfulCalls / metrics.totalCalls) * 100;
      report.push(`
Operation: ${operation}
  Total Calls: ${metrics.totalCalls}
  Success Rate: ${successRate.toFixed(1)}%
  Average Duration: ${metrics.averageDuration.toFixed(2)}ms
  Min Duration: ${metrics.minDuration}ms
  Max Duration: ${metrics.maxDuration}ms
  Last Call: ${new Date(metrics.lastCall).toISOString()}
`);
    }
    
    return report.join('\n');
  }
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  lastCall: number;
}