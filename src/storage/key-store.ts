import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface KeyStore {
  store(key: string): Promise<void>;
  retrieve(): Promise<string | null>;
  exists(): Promise<boolean>;
  remove(): Promise<void>;
}

export class EncryptedKeyStore implements KeyStore {
  private readonly keyPath: string;
  private readonly algorithm = 'aes-256-cbc';
  private readonly keyDerivationSalt: string;

  constructor() {
    const configDir = path.join(os.homedir(), '.requesty');
    this.keyPath = path.join(configDir, 'key.enc');
    this.keyDerivationSalt = 'requesty-cli-salt-v1';
    
    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  private deriveKey(password: string): Buffer {
    // Use machine-specific info as password base
    const machineId = os.hostname() + os.userInfo().username;
    const combinedPassword = password + machineId + this.keyDerivationSalt;
    return crypto.pbkdf2Sync(combinedPassword, this.keyDerivationSalt, 100000, 32, 'sha256');
  }

  private getMachinePassword(): string {
    // Create a machine-specific password
    const machineInfo = os.hostname() + os.userInfo().username + os.platform();
    return crypto.createHash('sha256').update(machineInfo).digest('hex').slice(0, 32);
  }

  async store(apiKey: string): Promise<void> {
    try {
      const password = this.getMachinePassword();
      const key = this.deriveKey(password);
      
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      let encrypted = cipher.update(apiKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const encryptedData = {
        iv: iv.toString('hex'),
        encrypted: encrypted
      };
      
      fs.writeFileSync(this.keyPath, JSON.stringify(encryptedData));
    } catch (error) {
      throw new Error(`Failed to store API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async retrieve(): Promise<string | null> {
    try {
      if (!fs.existsSync(this.keyPath)) {
        return null;
      }
      
      const encryptedData = JSON.parse(fs.readFileSync(this.keyPath, 'utf8'));
      
      const password = this.getMachinePassword();
      const key = this.deriveKey(password);
      
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // If decryption fails, key might be corrupted or from different machine
      return null;
    }
  }

  async exists(): Promise<boolean> {
    return fs.existsSync(this.keyPath);
  }

  async remove(): Promise<void> {
    try {
      if (fs.existsSync(this.keyPath)) {
        fs.unlinkSync(this.keyPath);
      }
    } catch (error) {
      throw new Error(`Failed to remove stored key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}