/**
 * Unit tests for Performance Monitor
 */

import { PerformanceMonitor } from '../../utils/performance-monitor';
import { TestUtils } from '../test-utils';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.resetMetrics();
  });

  describe('startMeasurement', () => {
    it('should start a new measurement', () => {
      const operationId = 'test-operation';
      const startTime = PerformanceMonitor.startMeasurement(operationId);
      
      expect(startTime).toBeGreaterThan(0);
      expect(typeof startTime).toBe('number');
    });

    it('should overwrite existing measurement with same ID', () => {
      const operationId = 'test-operation';
      
      const startTime1 = PerformanceMonitor.startMeasurement(operationId);
      await TestUtils.waitFor(() => true, 10); // Small delay
      const startTime2 = PerformanceMonitor.startMeasurement(operationId);
      
      expect(startTime2).toBeGreaterThan(startTime1);
    });
  });

  describe('endMeasurement', () => {
    it('should end measurement and return duration', () => {
      const operationId = 'test-operation';
      
      PerformanceMonitor.startMeasurement(operationId);
      const duration = PerformanceMonitor.endMeasurement(operationId);
      
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(typeof duration).toBe('number');
    });

    it('should throw error for non-existent measurement', () => {
      expect(() => {
        PerformanceMonitor.endMeasurement('non-existent');
      }).toThrow('No measurement found for operation: non-existent');
    });

    it('should remove measurement after ending', () => {
      const operationId = 'test-operation';
      
      PerformanceMonitor.startMeasurement(operationId);
      PerformanceMonitor.endMeasurement(operationId);
      
      expect(() => {
        PerformanceMonitor.endMeasurement(operationId);
      }).toThrow('No measurement found for operation: test-operation');
    });
  });

  describe('measureAsync', () => {
    it('should measure async operation and return result with duration', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'test-result';
      };
      
      const { result, duration } = await PerformanceMonitor.measureAsync(
        operation,
        'async-test'
      );
      
      expect(result).toBe('test-result');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle async operation errors', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Operation failed');
      };
      
      await expect(
        PerformanceMonitor.measureAsync(operation, 'async-error-test')
      ).rejects.toThrow('Operation failed');
      
      // Should still update metrics for failed operations
      const metrics = PerformanceMonitor.getMetrics('async-error-test');
      expect(metrics).toBeDefined();
      expect(metrics!.totalCalls).toBe(1);
      expect(metrics!.failedCalls).toBe(1);
    });

    it('should update metrics for successful operations', async () => {
      const operation = async () => 'success';
      
      await PerformanceMonitor.measureAsync(operation, 'success-test');
      
      const metrics = PerformanceMonitor.getMetrics('success-test');
      expect(metrics).toBeDefined();
      expect(metrics!.totalCalls).toBe(1);
      expect(metrics!.successfulCalls).toBe(1);
      expect(metrics!.failedCalls).toBe(0);
    });
  });

  describe('measureSync', () => {
    it('should measure sync operation and return result with duration', () => {
      const operation = () => 'sync-result';
      
      const { result, duration } = PerformanceMonitor.measureSync(
        operation,
        'sync-test'
      );
      
      expect(result).toBe('sync-result');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle sync operation errors', () => {
      const operation = () => {
        throw new Error('Sync operation failed');
      };
      
      expect(() => {
        PerformanceMonitor.measureSync(operation, 'sync-error-test');
      }).toThrow('Sync operation failed');
      
      // Should still update metrics for failed operations
      const metrics = PerformanceMonitor.getMetrics('sync-error-test');
      expect(metrics).toBeDefined();
      expect(metrics!.totalCalls).toBe(1);
      expect(metrics!.failedCalls).toBe(1);
    });

    it('should update metrics for successful operations', () => {
      const operation = () => 'success';
      
      PerformanceMonitor.measureSync(operation, 'sync-success-test');
      
      const metrics = PerformanceMonitor.getMetrics('sync-success-test');
      expect(metrics).toBeDefined();
      expect(metrics!.totalCalls).toBe(1);
      expect(metrics!.successfulCalls).toBe(1);
      expect(metrics!.failedCalls).toBe(0);
    });
  });

  describe('getMetrics', () => {
    it('should return metrics for existing operation', () => {
      PerformanceMonitor.measureSync(() => 'test', 'test-operation');
      
      const metrics = PerformanceMonitor.getMetrics('test-operation');
      
      expect(metrics).toBeDefined();
      expect(metrics!.totalCalls).toBe(1);
      expect(metrics!.successfulCalls).toBe(1);
      expect(metrics!.averageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should return undefined for non-existent operation', () => {
      const metrics = PerformanceMonitor.getMetrics('non-existent');
      expect(metrics).toBeUndefined();
    });
  });

  describe('getAllMetrics', () => {
    it('should return all metrics', () => {
      PerformanceMonitor.measureSync(() => 'test1', 'operation1');
      PerformanceMonitor.measureSync(() => 'test2', 'operation2');
      
      const allMetrics = PerformanceMonitor.getAllMetrics();
      
      expect(allMetrics.size).toBe(2);
      expect(allMetrics.has('operation1')).toBe(true);
      expect(allMetrics.has('operation2')).toBe(true);
    });

    it('should return empty map when no metrics exist', () => {
      const allMetrics = PerformanceMonitor.getAllMetrics();
      expect(allMetrics.size).toBe(0);
    });
  });

  describe('resetMetrics', () => {
    it('should clear all metrics and measurements', () => {
      PerformanceMonitor.measureSync(() => 'test', 'test-operation');
      PerformanceMonitor.startMeasurement('active-operation');
      
      PerformanceMonitor.resetMetrics();
      
      expect(PerformanceMonitor.getAllMetrics().size).toBe(0);
      expect(() => {
        PerformanceMonitor.endMeasurement('active-operation');
      }).toThrow('No measurement found for operation: active-operation');
    });
  });

  describe('getReport', () => {
    it('should generate performance report', () => {
      // Add some test metrics
      PerformanceMonitor.measureSync(() => 'test1', 'operation1');
      PerformanceMonitor.measureSync(() => 'test2', 'operation2');
      
      const report = PerformanceMonitor.getReport();
      
      expect(report).toContain('Performance Report');
      expect(report).toContain('operation1');
      expect(report).toContain('operation2');
      expect(report).toContain('Total Calls');
      expect(report).toContain('Success Rate');
      expect(report).toContain('Average Duration');
    });

    it('should handle empty metrics', () => {
      const report = PerformanceMonitor.getReport();
      
      expect(report).toContain('Performance Report');
      expect(report).toContain('================');
    });
  });

  describe('metrics calculation', () => {
    it('should calculate metrics correctly for multiple operations', () => {
      // Perform multiple operations to test metric calculations
      PerformanceMonitor.measureSync(() => 'success1', 'multi-test');
      PerformanceMonitor.measureSync(() => 'success2', 'multi-test');
      
      try {
        PerformanceMonitor.measureSync(() => {
          throw new Error('Test error');
        }, 'multi-test');
      } catch (e) {
        // Expected error
      }
      
      const metrics = PerformanceMonitor.getMetrics('multi-test');
      
      expect(metrics!.totalCalls).toBe(3);
      expect(metrics!.successfulCalls).toBe(2);
      expect(metrics!.failedCalls).toBe(1);
      expect(metrics!.averageDuration).toBeGreaterThanOrEqual(0);
      expect(metrics!.minDuration).toBeGreaterThanOrEqual(0);
      expect(metrics!.maxDuration).toBeGreaterThanOrEqual(metrics!.minDuration);
    });

    it('should track last call timestamp', () => {
      const beforeCall = Date.now();
      PerformanceMonitor.measureSync(() => 'test', 'timestamp-test');
      const afterCall = Date.now();
      
      const metrics = PerformanceMonitor.getMetrics('timestamp-test');
      
      expect(metrics!.lastCall).toBeGreaterThanOrEqual(beforeCall);
      expect(metrics!.lastCall).toBeLessThanOrEqual(afterCall);
    });
  });
});