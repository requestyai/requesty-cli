import * as inquirer from 'inquirer';
import * as chalk from 'chalk';
import { EncryptedKeyStore } from '../storage/key-store';
import { ErrorHandler } from './error-handler';
import { InputValidator } from './input-validator';
import { PerformanceMonitor } from './performance-monitor';

export class KeyManager {
  private keyStore: EncryptedKeyStore;

  constructor() {
    this.keyStore = new EncryptedKeyStore();
  }

  async getApiKey(): Promise<string> {
    return PerformanceMonitor.measureAsync(
      async () => {
        try {
          // First check if we have a stored key
          const storedKey = await this.keyStore.retrieve();
          
          if (storedKey) {
            const { useStored } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'useStored',
                message: 'Found stored API key. Would you like to use it?',
                default: true
              }
            ]);

            if (useStored) {
              console.log(chalk.green('✅ Using stored API key'));
              return storedKey;
            }
          }

          // Ask for new API key
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
                try {
                  InputValidator.validateApiKey(input.trim());
                  return true;
                } catch (error) {
                  return error instanceof Error ? error.message : 'Invalid API key format';
                }
              }
            }
          ]);

          // Validate the final API key
          const validatedApiKey = InputValidator.validateApiKey(apiKey);

          // Ask if they want to store it
          const { storeKey } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'storeKey',
              message: 'Would you like to securely store this API key for future use?',
              default: true
            }
          ]);

          if (storeKey) {
            try {
              await this.keyStore.store(validatedApiKey);
              console.log(chalk.green('✅ API key stored securely'));
            } catch (error) {
              console.log(chalk.yellow('⚠️  Warning: Could not store API key. You\'ll need to enter it again next time.'));
            }
          }

          return validatedApiKey;
        } catch (error) {
          ErrorHandler.handleSecurityError(error, 'API key management', true);
        }
      },
      'key-manager-get-api-key'
    ).then(result => result.result);
  }

  async removeStoredKey(): Promise<void> {
    return PerformanceMonitor.measureAsync(
      async () => {
        try {
          await this.keyStore.remove();
          console.log(chalk.green('✅ Stored API key removed'));
        } catch (error) {
          console.log(chalk.red('❌ Error removing stored key'));
          ErrorHandler.handleSecurityError(error, 'API key removal', false);
        }
      },
      'key-manager-remove-stored-key'
    ).then(result => result.result);
  }

  async hasStoredKey(): Promise<boolean> {
    return await this.keyStore.exists();
  }
}