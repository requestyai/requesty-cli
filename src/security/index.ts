/**
 * Security module exports
 * 
 * This module provides ultra-secure API key management and encryption
 * for the Requesty CLI application.
 */

export { CryptoManager } from './crypto-manager';
export { SecureKeyStore } from './secure-key-store';
export { SecureKeyManager } from './secure-key-manager';
export { SecureApiClient } from './secure-api-client';

// Re-export utility classes for convenience
export { ErrorHandler } from '../utils/error-handler';
export { InputValidator } from '../utils/input-validator';
export { PerformanceMonitor } from '../utils/performance-monitor';

/**
 * Security configuration constants
 */
export const SECURITY_CONFIG = {
  ENCRYPTION_ALGORITHM: 'AES-256-CBC',
  KEY_DERIVATION: 'PBKDF2-SHA256',
  TLS_VERSION: 'TLS 1.2+',
  KEY_ITERATIONS: 100000,
  SALT_LENGTH: 32,
  KEY_LENGTH: 32,
  IV_LENGTH: 16,
  TAG_LENGTH: 16
} as const;

/**
 * Security audit information
 */
export const SECURITY_AUDIT = {
  lastUpdated: '2024-01-01',
  version: '2.0.0',
  level: 'fortress',
  features: [
    'AES-256-CBC encryption',
    'PBKDF2-SHA256 key derivation',
    'Machine fingerprinting',
    'Secure memory management',
    'TLS 1.2+ enforcement',
    'Timing attack protection',
    'Secure key validation',
    'Atomic file operations',
    'Secure file deletion',
    'Anti-tampering protection',
    'Centralized error handling',
    'Input validation & sanitization',
    'Performance monitoring',
    'Audit logging'
  ]
} as const;

/**
 * Security utilities for enhanced error handling and validation
 */
export const SECURITY_UTILS = {
  errorHandling: {
    handleSecurityError: 'Security-specific error handling with audit logging',
    handleApiError: 'API error handling with retry logic support',
    handleFileError: 'File operation error handling with path sanitization',
    handleValidationError: 'Validation error handling with detailed feedback'
  },
  inputValidation: {
    validateApiKey: 'API key format and security validation',
    validateFilePath: 'File path validation with security checks',
    validateUrl: 'URL validation with security constraints',
    validatePrompt: 'User prompt sanitization and validation'
  },
  performanceMonitoring: {
    measureAsync: 'Async operation performance tracking',
    measureSync: 'Sync operation performance tracking',
    getMetrics: 'Performance metrics retrieval',
    getReport: 'Performance summary reporting'
  }
} as const;