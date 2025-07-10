import * as crypto from 'crypto';
import * as os from 'os';
import { ErrorHandler } from '../utils/error-handler';
import { PerformanceMonitor } from '../utils/performance-monitor';

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
    return PerformanceMonitor.measureSync(() => {
      try {
        // Validate inputs
        if (!password || typeof password !== 'string') {
          throw new Error('Password must be a non-empty string');
        }
        if (!salt || salt.length !== this.SALT_LENGTH) {
          throw new Error('Salt must be exactly 32 bytes');
        }

        return crypto.pbkdf2Sync(
          password,
          salt,
          this.ITERATIONS,
          this.KEY_LENGTH,
          'sha256'
        );
      } catch (error) {
        ErrorHandler.handleSecurityError(error, 'key derivation', true);
      }
    }, 'crypto-derive-key').result;
  }

  /**
   * Encrypt sensitive data using AES-256-CBC
   */
  static encrypt(
    data: string,
    key: Buffer
  ): {
    encrypted: Buffer;
    iv: Buffer;
    tag: Buffer;
  } {
    return PerformanceMonitor.measureSync(() => {
      try {
        // Validate inputs
        if (!data || typeof data !== 'string') {
          throw new Error('Data must be a non-empty string');
        }
        if (!key || key.length !== this.KEY_LENGTH) {
          throw new Error('Key must be exactly 32 bytes');
        }

        const iv = crypto.randomBytes(this.IV_LENGTH);
        const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

        let encrypted = cipher.update(data, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        // For CBC mode, we create a hash tag for integrity
        const tag = crypto
          .createHash('sha256')
          .update(encrypted)
          .digest()
          .slice(0, this.TAG_LENGTH);

        return { encrypted, iv, tag };
      } catch (error) {
        ErrorHandler.handleSecurityError(error, 'data encryption', true);
      }
    }, 'crypto-encrypt').result;
  }

  /**
   * Decrypt sensitive data using AES-256-CBC
   */
  static decrypt(
    encrypted: Buffer,
    key: Buffer,
    iv: Buffer,
    tag: Buffer
  ): string {
    return PerformanceMonitor.measureSync(() => {
      try {
        // Validate inputs
        if (!encrypted || !key || !iv || !tag) {
          throw new Error('All decryption parameters are required');
        }
        if (key.length !== this.KEY_LENGTH) {
          throw new Error('Key must be exactly 32 bytes');
        }
        if (iv.length !== this.IV_LENGTH) {
          throw new Error('IV must be exactly 16 bytes');
        }
        if (tag.length !== this.TAG_LENGTH) {
          throw new Error('Tag must be exactly 16 bytes');
        }

        // Verify integrity first
        const expectedTag = crypto
          .createHash('sha256')
          .update(encrypted)
          .digest()
          .slice(0, this.TAG_LENGTH);
        if (!crypto.timingSafeEqual(tag, expectedTag)) {
          throw new Error('Data integrity check failed');
        }

        const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);

        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
      } catch (error) {
        ErrorHandler.handleSecurityError(error, 'data decryption', true);
      }
    }, 'crypto-decrypt').result;
  }

  /**
   * Generate machine-specific fingerprint for additional security
   */
  static generateMachineFingerprint(): string {
    const machineId =
      os.hostname() + os.platform() + os.arch() + os.userInfo().username;
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
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
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
    return PerformanceMonitor.measureSync(() => {
      try {
        if (!data || !expectedHash) {
          throw new Error('Data and expected hash are required');
        }

        const actualHash = crypto
          .createHash('sha256')
          .update(data)
          .digest('hex');
        return crypto.timingSafeEqual(
          Buffer.from(actualHash),
          Buffer.from(expectedHash)
        );
      } catch (error) {
        ErrorHandler.handleSecurityError(error, 'integrity validation', false);
      }
    }, 'crypto-validate-integrity').result;
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
    try {
      if (!a || !b || typeof a !== 'string' || typeof b !== 'string') {
        return false;
      }

      if (a.length !== b.length) {
        return false;
      }

      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch (error) {
      // Don't throw errors in comparison functions - just return false
      return false;
    }
  }
}
