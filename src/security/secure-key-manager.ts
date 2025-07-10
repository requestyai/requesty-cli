import * as chalk from 'chalk';
import * as crypto from 'crypto';
import * as inquirer from 'inquirer';
import { SecureKeyStore } from './secure-key-store';

import { ErrorHandler } from '../utils/error-handler';
import { InputValidator } from '../utils/input-validator';
import { PerformanceMonitor } from '../utils/performance-monitor';

/**
 * Ultra-secure API key manager with advanced security features
 */
export class SecureKeyManager {
  private keyStore: SecureKeyStore;
  private static readonly API_KEY_MIN_LENGTH = 32;
  private static readonly API_KEY_MAX_LENGTH = 256;
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.keyStore = new SecureKeyStore();
  }

  /**
   * Validate API key format and strength
   */
  private validateApiKey(apiKey: string): { valid: boolean; error?: string } {
    try {
      // Use InputValidator for consistent validation
      InputValidator.validateApiKey(apiKey);

      // Additional security-specific validations
      if (apiKey.length < SecureKeyManager.API_KEY_MIN_LENGTH) {
        return {
          valid: false,
          error: `API key must be at least ${SecureKeyManager.API_KEY_MIN_LENGTH} characters`,
        };
      }

      if (apiKey.length > SecureKeyManager.API_KEY_MAX_LENGTH) {
        return {
          valid: false,
          error: `API key must not exceed ${SecureKeyManager.API_KEY_MAX_LENGTH} characters`,
        };
      }

      // Check for minimum entropy (basic check)
      const uniqueChars = new Set(apiKey.split('')).size;
      if (uniqueChars < 8) {
        return {
          valid: false,
          error: 'API key does not meet minimum complexity requirements',
        };
      }

      return { valid: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'API key validation failed';
      return { valid: false, error: message };
    }
  }

  /**
   * Securely prompt for API key with validation
   */
  private async promptForApiKey(): Promise<string> {
    console.log(chalk.yellow('🔐 Secure API Key Input'));
    console.log(
      chalk.gray('Your API key will be encrypted and stored securely')
    );
    console.log(chalk.gray('API key input is hidden for security\n'));

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const { apiKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: '🔑 Enter your Requesty API key:',
          mask: '*',
          validate: (input: string) => {
            if (!input.trim()) {
              return 'API key cannot be empty';
            }
            return true;
          },
        },
      ]);

      const trimmedKey = apiKey.trim();
      const validation = this.validateApiKey(trimmedKey);

      if (validation.valid) {
        return trimmedKey;
      }

      attempts++;
      console.log(chalk.red(`❌ ${validation.error}`));

      if (attempts < maxAttempts) {
        console.log(
          chalk.yellow(
            `Please try again. Attempts remaining: ${maxAttempts - attempts}`
          )
        );
      }
    }

    throw new Error(
      'Maximum attempts exceeded. Please restart the application.'
    );
  }

  /**
   * Get API key with advanced security measures
   */
  async getApiKey(): Promise<string> {
    return PerformanceMonitor.measureAsync(async () => {
      try {
        // Check if key store integrity is valid
        if (await this.keyStore.validateIntegrity()) {
          const storedKey = await this.keyStore.retrieve();
          if (storedKey) {
            const { useStored } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'useStored',
                message: '🔐 Found securely stored API key. Use it?',
                default: true,
              },
            ]);

            if (useStored) {
              console.log(chalk.green('✅ Using securely stored API key'));
              return storedKey;
            }
          }
        }

        // Prompt for new API key
        const apiKey = await this.promptForApiKey();

        // Ask if user wants to store the key securely
        const { storeKey } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'storeKey',
            message: '💾 Store API key securely for future use?',
            default: true,
          },
        ]);

        if (storeKey) {
          try {
            await this.keyStore.store(apiKey);
            console.log(
              chalk.green(
                '✅ API key stored securely with AES-256-CBC encryption'
              )
            );
            console.log(
              chalk.gray(
                '🔒 Key is bound to this machine and encrypted with a unique salt'
              )
            );
          } catch (error) {
            console.log(
              chalk.yellow('⚠️  Warning: Could not store API key securely')
            );
            console.log(
              chalk.gray('You will need to enter it again next time')
            );
          }
        }

        return apiKey;
      } catch (error) {
        ErrorHandler.handleSecurityError(error, 'API key retrieval', true);
      }
    }, 'get-api-key').then((result) => result.result);
  }

  /**
   * Remove stored API key securely
   */
  async removeStoredKey(): Promise<void> {
    return PerformanceMonitor.measureAsync(async () => {
      try {
        if (!(await this.keyStore.exists())) {
          console.log(chalk.yellow('No stored API key found'));
          return;
        }

        const { confirmDelete } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmDelete',
            message: '🗑️  Are you sure you want to remove the stored API key?',
            default: false,
          },
        ]);

        if (confirmDelete) {
          await this.keyStore.remove();
          console.log(chalk.green('✅ API key removed securely'));
          console.log(
            chalk.gray('🔒 Key data has been overwritten with random data')
          );
        }
      } catch (error) {
        console.log(chalk.red('❌ Error removing stored key'));
        ErrorHandler.handleSecurityError(error, 'API key removal', false);
      }
    }, 'remove-stored-key').then((result) => result.result);
  }

  /**
   * Check if API key is stored
   */
  async hasStoredKey(): Promise<boolean> {
    return await this.keyStore.exists();
  }

  /**
   * Get key store information
   */
  getKeyStoreInfo(): any {
    return this.keyStore.getInfo();
  }

  /**
   * Validate current key store integrity
   */
  async validateKeyStore(): Promise<boolean> {
    return await this.keyStore.validateIntegrity();
  }

  /**
   * Create secure HTTP headers for API requests
   */
  createSecureHeaders(apiKey: string): Record<string, string> {
    try {
      // Validate API key before creating headers
      const validatedApiKey = InputValidator.validateApiKey(apiKey);

      const timestamp = Date.now().toString();
      const nonce = crypto.randomBytes(16).toString('hex');

      return {
        Authorization: `Bearer ${validatedApiKey}`,
        'X-Requesty-Timestamp': timestamp,
        'X-Requesty-Nonce': nonce,
        'X-Requesty-Client': 'requesty-cli-secure',
        'HTTP-Referer': 'https://github.com/requestyai/requesty-cli',
        'X-Title': 'requesty-cli',
        'User-Agent': 'requesty-cli/2.0.0-secure',
      };
    } catch (error) {
      ErrorHandler.handleSecurityError(error, 'Creating secure headers', true);
    }
  }

  /**
   * Securely clear API key from memory
   */
  static secureCleanup(): void {
    // Clear environment variables
    const envVars = ['REQUESTY_API_KEY', 'REQUESTY_MASTER_KEY'];
    for (const envVar of envVars) {
      if (process.env[envVar]) {
        delete process.env[envVar];
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
}
