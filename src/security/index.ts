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
    'Anti-tampering protection'
  ]
} as const;