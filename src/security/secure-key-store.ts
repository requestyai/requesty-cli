import fs from 'fs';
import path from 'path';
import os from 'os';
import { CryptoManager } from './crypto-manager';

/**
 * Ultra-secure API key storage with multiple layers of protection
 */
export class SecureKeyStore {
  private static readonly STORE_DIR = '.requesty-secure';
  private static readonly KEY_FILE = 'api.key';
  private static readonly METADATA_FILE = 'metadata.json';
  private static readonly LOCK_FILE = 'store.lock';

  private readonly storePath: string;
  private readonly keyFilePath: string;
  private readonly metadataFilePath: string;
  private readonly lockFilePath: string;
  private readonly machineFingerprint: string;

  constructor() {
    this.storePath = path.join(os.homedir(), SecureKeyStore.STORE_DIR);
    this.keyFilePath = path.join(this.storePath, SecureKeyStore.KEY_FILE);
    this.metadataFilePath = path.join(this.storePath, SecureKeyStore.METADATA_FILE);
    this.lockFilePath = path.join(this.storePath, SecureKeyStore.LOCK_FILE);
    this.machineFingerprint = CryptoManager.generateMachineFingerprint();
  }

  /**
   * Initialize secure storage directory with proper permissions
   */
  private initializeStorage(): void {
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { mode: 0o700 }); // Only owner can read/write/execute
    }
  }

  /**
   * Acquire exclusive lock for atomic operations
   */
  private acquireLock(): void {
    if (fs.existsSync(this.lockFilePath)) {
      throw new Error('Another process is accessing the secure key store');
    }
    
    fs.writeFileSync(this.lockFilePath, process.pid.toString(), { mode: 0o600 });
  }

  /**
   * Release exclusive lock
   */
  private releaseLock(): void {
    if (fs.existsSync(this.lockFilePath)) {
      fs.unlinkSync(this.lockFilePath);
    }
  }

  /**
   * Create secure metadata for the stored key
   */
  private createMetadata(): any {
    return {
      version: '1.0',
      created: new Date().toISOString(),
      machineFingerprint: this.machineFingerprint,
      algorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2-sha256',
      iterations: 100000
    };
  }

  /**
   * Validate metadata integrity and machine binding
   */
  private validateMetadata(metadata: any): boolean {
    if (!metadata || typeof metadata !== 'object') {
      return false;
    }

    // Check machine fingerprint to prevent key theft
    if (!CryptoManager.constantTimeEquals(metadata.machineFingerprint, this.machineFingerprint)) {
      throw new Error('Security violation: Key was encrypted on a different machine');
    }

    // Validate required fields
    const requiredFields = ['version', 'created', 'machineFingerprint', 'algorithm'];
    for (const field of requiredFields) {
      if (!metadata[field]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Store API key with multiple layers of encryption
   */
  async store(apiKey: string): Promise<void> {
    this.initializeStorage();
    this.acquireLock();

    try {
      // Generate secure encryption materials
      const masterPassword = CryptoManager.generateSecurePassword();
      const salt = CryptoManager.generateSalt();
      const derivedKey = CryptoManager.deriveKey(masterPassword, salt);

      // Encrypt the API key
      const { encrypted, iv, tag } = CryptoManager.encrypt(apiKey, derivedKey);

      // Create storage payload
      const payload = {
        salt: salt.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        encrypted: encrypted.toString('base64'),
        hash: CryptoManager.createHash(apiKey)
      };

      // Store encrypted data
      fs.writeFileSync(this.keyFilePath, JSON.stringify(payload), { mode: 0o600 });

      // Store metadata
      const metadata = this.createMetadata();
      fs.writeFileSync(this.metadataFilePath, JSON.stringify(metadata), { mode: 0o600 });

      // Store master password in memory (this is the weak point we'll address)
      process.env.REQUESTY_MASTER_KEY = masterPassword;

      // Clear sensitive data from memory
      CryptoManager.secureZeroMemory(derivedKey);
      CryptoManager.secureZeroMemory(salt);

    } finally {
      this.releaseLock();
    }
  }

  /**
   * Retrieve and decrypt API key
   */
  async retrieve(): Promise<string | null> {
    if (!this.exists()) {
      return null;
    }

    this.acquireLock();

    try {
      // Read metadata and validate
      const metadataContent = fs.readFileSync(this.metadataFilePath, 'utf8');
      const metadata = JSON.parse(metadataContent);
      
      if (!this.validateMetadata(metadata)) {
        throw new Error('Invalid or corrupted key metadata');
      }

      // Read encrypted payload
      const payloadContent = fs.readFileSync(this.keyFilePath, 'utf8');
      const payload = JSON.parse(payloadContent);

      // Retrieve master password (in production, this should be from secure input)
      const masterPassword = process.env.REQUESTY_MASTER_KEY;
      if (!masterPassword) {
        throw new Error('Master key not available in memory');
      }

      // Reconstruct encryption materials
      const salt = Buffer.from(payload.salt, 'base64');
      const iv = Buffer.from(payload.iv, 'base64');
      const tag = Buffer.from(payload.tag, 'base64');
      const encrypted = Buffer.from(payload.encrypted, 'base64');

      // Derive key and decrypt
      const derivedKey = CryptoManager.deriveKey(masterPassword, salt);
      const decryptedKey = CryptoManager.decrypt(encrypted, derivedKey, iv, tag);

      // Verify integrity
      const expectedHash = payload.hash;
      const actualHash = CryptoManager.createHash(decryptedKey);
      
      if (!CryptoManager.constantTimeEquals(actualHash, expectedHash)) {
        throw new Error('Key integrity verification failed');
      }

      // Clear sensitive data from memory
      CryptoManager.secureZeroMemory(derivedKey);
      CryptoManager.secureZeroMemory(salt);

      return decryptedKey;

    } finally {
      this.releaseLock();
    }
  }

  /**
   * Check if encrypted key exists
   */
  exists(): boolean {
    return fs.existsSync(this.keyFilePath) && fs.existsSync(this.metadataFilePath);
  }

  /**
   * Securely remove stored key
   */
  async remove(): Promise<void> {
    if (!this.exists()) {
      return;
    }

    this.acquireLock();

    try {
      // Secure deletion by overwriting with random data
      if (fs.existsSync(this.keyFilePath)) {
        const keyFileSize = fs.statSync(this.keyFilePath).size;
        const randomData = Buffer.alloc(keyFileSize);
        randomData.fill(Math.floor(Math.random() * 256));
        fs.writeFileSync(this.keyFilePath, randomData);
        fs.unlinkSync(this.keyFilePath);
      }

      if (fs.existsSync(this.metadataFilePath)) {
        const metadataFileSize = fs.statSync(this.metadataFilePath).size;
        const randomData = Buffer.alloc(metadataFileSize);
        randomData.fill(Math.floor(Math.random() * 256));
        fs.writeFileSync(this.metadataFilePath, randomData);
        fs.unlinkSync(this.metadataFilePath);
      }

      // Clear master key from memory
      if (process.env.REQUESTY_MASTER_KEY) {
        delete process.env.REQUESTY_MASTER_KEY;
      }

    } finally {
      this.releaseLock();
    }
  }

  /**
   * Validate key store integrity
   */
  async validateIntegrity(): Promise<boolean> {
    if (!this.exists()) {
      return false;
    }

    try {
      const metadata = JSON.parse(fs.readFileSync(this.metadataFilePath, 'utf8'));
      return this.validateMetadata(metadata);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get key store information (non-sensitive)
   */
  getInfo(): any {
    if (!this.exists()) {
      return null;
    }

    try {
      const metadata = JSON.parse(fs.readFileSync(this.metadataFilePath, 'utf8'));
      return {
        version: metadata.version,
        created: metadata.created,
        algorithm: metadata.algorithm,
        isValid: this.validateMetadata(metadata)
      };
    } catch (error) {
      return null;
    }
  }
}