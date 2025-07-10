/**
 * Unit tests for crypto manager - critical security component
 */

import { CryptoManager } from '../../../src/security/crypto-manager';
import { TestHelper } from '../../helpers/test-utils';

describe('CryptoManager', () => {
  let cryptoManager: CryptoManager;
  let testHelper: TestHelper;

  beforeEach(() => {
    testHelper = TestHelper.getInstance();
    cryptoManager = new CryptoManager();
  });

  afterEach(() => {
    testHelper.cleanup();
  });

  describe('key generation', () => {
    it('should generate unique keys each time', async () => {
      const key1 = await cryptoManager.generateKey('password1', 'salt1');
      const key2 = await cryptoManager.generateKey('password2', 'salt2');
      
      expect(key1).not.toEqual(key2);
      expect(key1).toHaveLength(64); // 32 bytes * 2 (hex encoding)
      expect(key2).toHaveLength(64);
    });

    it('should generate same key for same password and salt', async () => {
      const key1 = await cryptoManager.generateKey('password', 'salt');
      const key2 = await cryptoManager.generateKey('password', 'salt');
      
      expect(key1).toEqual(key2);
    });

    it('should handle invalid input gracefully', async () => {
      await expect(cryptoManager.generateKey('', 'salt')).rejects.toThrow();
      await expect(cryptoManager.generateKey('password', '')).rejects.toThrow();
    });
  });

  describe('encryption and decryption', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const originalData = 'sensitive_api_key_12345';
      const password = 'master_password';
      const salt = 'unique_salt_123';

      const encrypted = await cryptoManager.encrypt(originalData, password, salt);
      const decrypted = await cryptoManager.decrypt(encrypted, password, salt);

      expect(decrypted).toBe(originalData);
      expect(encrypted).not.toBe(originalData);
    });

    it('should produce different encrypted output for same input', async () => {
      const data = 'test_data';
      const password = 'password';
      const salt = 'salt';

      const encrypted1 = await cryptoManager.encrypt(data, password, salt);
      const encrypted2 = await cryptoManager.encrypt(data, password, salt);

      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same value
      const decrypted1 = await cryptoManager.decrypt(encrypted1, password, salt);
      const decrypted2 = await cryptoManager.decrypt(encrypted2, password, salt);
      
      expect(decrypted1).toBe(data);
      expect(decrypted2).toBe(data);
    });

    it('should fail decryption with wrong password', async () => {
      const data = 'secret_data';
      const correctPassword = 'correct_password';
      const wrongPassword = 'wrong_password';
      const salt = 'salt';

      const encrypted = await cryptoManager.encrypt(data, correctPassword, salt);
      
      await expect(cryptoManager.decrypt(encrypted, wrongPassword, salt)).rejects.toThrow();
    });

    it('should fail decryption with wrong salt', async () => {
      const data = 'secret_data';
      const password = 'password';
      const correctSalt = 'correct_salt';
      const wrongSalt = 'wrong_salt';

      const encrypted = await cryptoManager.encrypt(data, password, correctSalt);
      
      await expect(cryptoManager.decrypt(encrypted, password, wrongSalt)).rejects.toThrow();
    });

    it('should handle invalid encrypted data', async () => {
      const password = 'password';
      const salt = 'salt';

      await expect(cryptoManager.decrypt('invalid_encrypted_data', password, salt)).rejects.toThrow();
      await expect(cryptoManager.decrypt('', password, salt)).rejects.toThrow();
    });
  });

  describe('secure comparison', () => {
    it('should perform timing-safe comparison', () => {
      const value1 = 'secret_value';
      const value2 = 'secret_value';
      const value3 = 'different_value';

      expect(cryptoManager.secureCompare(value1, value2)).toBe(true);
      expect(cryptoManager.secureCompare(value1, value3)).toBe(false);
    });

    it('should handle different length strings', () => {
      const short = 'short';
      const long = 'much_longer_string';

      expect(cryptoManager.secureCompare(short, long)).toBe(false);
    });
  });

  describe('random generation', () => {
    it('should generate random bytes', () => {
      const bytes1 = cryptoManager.generateRandomBytes(32);
      const bytes2 = cryptoManager.generateRandomBytes(32);

      expect(bytes1).toHaveLength(32);
      expect(bytes2).toHaveLength(32);
      expect(bytes1).not.toEqual(bytes2);
    });

    it('should generate random strings', () => {
      const str1 = cryptoManager.generateRandomString(16);
      const str2 = cryptoManager.generateRandomString(16);

      expect(str1).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(str2).toHaveLength(32);
      expect(str1).not.toBe(str2);
    });
  });

  describe('hash functions', () => {
    it('should generate consistent hashes', () => {
      const data = 'test_data';
      const hash1 = cryptoManager.hash(data);
      const hash2 = cryptoManager.hash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex output
    });

    it('should generate different hashes for different data', () => {
      const data1 = 'test_data_1';
      const data2 = 'test_data_2';

      const hash1 = cryptoManager.hash(data1);
      const hash2 = cryptoManager.hash(data2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('key derivation', () => {
    it('should derive keys with proper parameters', async () => {
      const password = 'strong_password';
      const salt = 'random_salt_123';
      const iterations = 100000;

      const derivedKey = await cryptoManager.deriveKey(password, salt, iterations);

      expect(derivedKey).toHaveLength(64); // 32 bytes hex encoded
      expect(typeof derivedKey).toBe('string');
    });

    it('should use secure iteration count', async () => {
      const password = 'password';
      const salt = 'salt';
      const minIterations = 100000;

      const derivedKey = await cryptoManager.deriveKey(password, salt, minIterations);
      
      // Should not throw and should produce valid key
      expect(derivedKey).toHaveLength(64);
    });
  });

  describe('memory security', () => {
    it('should clear sensitive data from memory', () => {
      const sensitiveData = 'sensitive_api_key';
      const buffer = Buffer.from(sensitiveData);

      cryptoManager.clearMemory(buffer);

      // Buffer should be zeroed
      expect(buffer.every(byte => byte === 0)).toBe(true);
    });
  });
});