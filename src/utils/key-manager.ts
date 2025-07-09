import inquirer from 'inquirer';
import chalk from 'chalk';
import { EncryptedKeyStore } from '../storage/key-store';

export class KeyManager {
  private keyStore: EncryptedKeyStore;

  constructor() {
    this.keyStore = new EncryptedKeyStore();
  }

  async getApiKey(): Promise<string> {
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
          return true;
        }
      }
    ]);

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
        await this.keyStore.store(apiKey);
        console.log(chalk.green('✅ API key stored securely'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Warning: Could not store API key. You\'ll need to enter it again next time.'));
      }
    }

    return apiKey;
  }

  async removeStoredKey(): Promise<void> {
    try {
      await this.keyStore.remove();
      console.log(chalk.green('✅ Stored API key removed'));
    } catch (error) {
      console.log(chalk.red('❌ Error removing stored key'));
    }
  }

  async hasStoredKey(): Promise<boolean> {
    return await this.keyStore.exists();
  }
}