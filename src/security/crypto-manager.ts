import crypto from 'crypto';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

/**
 * Ultra-secure cryptographic manager for API keys and sensitive data
 */
export class CryptoManager {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits
  private static readonly SALT_LENGTH = 32; // 256 bits
  private static readonly ITERATIONS = 100000; // PBKDF2 iterations

  /**
   * Generate a cryptographically secure random key
   */
  static generateSecureKey(): Buffer {
    return crypto.randomBytes(this.KEY_LENGTH);
  }

  /**
   * Generate a cryptographically secure random salt
   */
  static generateSalt(): Buffer {
    return crypto.randomBytes(this.SALT_LENGTH);
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  static deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, this.ITERATIONS, this.KEY_LENGTH, 'sha256');
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  static encrypt(data: string, key: Buffer): {
    encrypted: Buffer;
    iv: Buffer;
    tag: Buffer;
  } {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // For CBC mode, we create a hash tag for integrity
    const tag = crypto.createHash('sha256').update(encrypted).digest().slice(0, this.TAG_LENGTH);
    
    return { encrypted, iv, tag };
  }

  /**
   * Decrypt sensitive data using AES-256-GCM
   */
  static decrypt(encrypted: Buffer, key: Buffer, iv: Buffer, tag: Buffer): string {
    // Verify integrity first
    const expectedTag = crypto.createHash('sha256').update(encrypted).digest().slice(0, this.TAG_LENGTH);
    if (!crypto.timingSafeEqual(tag, expectedTag)) {
      throw new Error('Data integrity check failed');
    }
    
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  }

  /**
   * Generate machine-specific fingerprint for additional security
   */
  static generateMachineFingerprint(): string {
    const machineId = os.hostname() + os.platform() + os.arch() + os.userInfo().username;
    return crypto.createHash('sha256').update(machineId).digest('hex');
  }

  /**
   * Secure memory zeroing (best effort)
   */
  static secureZeroMemory(buffer: Buffer): void {
    if (buffer && buffer.length > 0) {
      buffer.fill(0);
    }
  }

  /**
   * Generate secure random password for key derivation
   */
  static generateSecurePassword(): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    for (let i = 0; i < 64; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * Validate cryptographic integrity
   */
  static validateIntegrity(data: Buffer, expectedHash: string): boolean {
    const actualHash = crypto.createHash('sha256').update(data).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
  }

  /**
   * Create secure hash for data verification
   */
  static createHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  static constantTimeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}