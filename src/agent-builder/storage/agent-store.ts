import fs from 'fs';
import path from 'path';
import os from 'os';
import { AgentDefinition, AgentExecution, AgentTemplate } from '../types/agent-types';
import { CryptoManager } from '../../security/crypto-manager';
import { SecureKeyStore } from '../../security/secure-key-store';

/**
 * Secure storage for agent definitions and executions
 */
export class AgentStore {
  private static readonly AGENTS_DIR = path.join(os.homedir(), '.requesty', 'agents');
  private static readonly EXECUTIONS_DIR = path.join(os.homedir(), '.requesty', 'executions');
  private static readonly TEMPLATES_DIR = path.join(os.homedir(), '.requesty', 'templates');
  private static readonly METADATA_FILE = 'metadata.json';

  private keyStore: SecureKeyStore;
  private encryptionKey?: Buffer;

  constructor() {
    this.keyStore = new SecureKeyStore();
    this.initializeDirectories();
  }

  /**
   * Initialize storage directories
   */
  private initializeDirectories(): void {
    [AgentStore.AGENTS_DIR, AgentStore.EXECUTIONS_DIR, AgentStore.TEMPLATES_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Get or create encryption key for agent storage
   */
  private async getEncryptionKey(): Promise<Buffer> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    // Use machine fingerprint + stored key for encryption
    const machineFingerprint = CryptoManager.generateMachineFingerprint();
    const salt = CryptoManager.generateSalt();
    this.encryptionKey = CryptoManager.deriveKey(machineFingerprint, salt);
    
    return this.encryptionKey;
  }

  /**
   * Save agent definition securely
   */
  async saveAgent(agent: AgentDefinition): Promise<void> {
    try {
      const key = await this.getEncryptionKey();
      const agentData = JSON.stringify(agent, null, 2);
      
      // Encrypt agent data
      const encrypted = CryptoManager.encrypt(agentData, key);
      
      // Save encrypted data
      const agentPath = path.join(AgentStore.AGENTS_DIR, `${agent.id}.json`);
      const encryptedData = {
        encrypted: encrypted.encrypted.toString('base64'),
        iv: encrypted.iv.toString('base64'),
        tag: encrypted.tag.toString('base64'),
        version: '1.0',
        created: new Date().toISOString(),
        checksum: CryptoManager.createHash(agentData)
      };

      fs.writeFileSync(agentPath, JSON.stringify(encryptedData, null, 2));
      
      // Update metadata
      await this.updateMetadata('agents', agent.id, {
        name: agent.name,
        description: agent.description,
        created: agent.created,
        updated: agent.updated,
        tags: agent.tags
      });

      console.log(`Agent '${agent.name}' saved securely`);
    } catch (error) {
      throw new Error(`Failed to save agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load agent definition
   */
  async loadAgent(agentId: string): Promise<AgentDefinition> {
    try {
      const agentPath = path.join(AgentStore.AGENTS_DIR, `${agentId}.json`);
      
      if (!fs.existsSync(agentPath)) {
        throw new Error(`Agent with ID '${agentId}' not found`);
      }

      const encryptedData = JSON.parse(fs.readFileSync(agentPath, 'utf8'));
      const key = await this.getEncryptionKey();

      // Decrypt agent data
      const decrypted = CryptoManager.decrypt(
        Buffer.from(encryptedData.encrypted, 'base64'),
        key,
        Buffer.from(encryptedData.iv, 'base64'),
        Buffer.from(encryptedData.tag, 'base64')
      );

      const agent = JSON.parse(decrypted) as AgentDefinition;
      
      // Verify checksum
      const expectedChecksum = CryptoManager.createHash(decrypted);
      if (!CryptoManager.constantTimeEquals(expectedChecksum, encryptedData.checksum)) {
        throw new Error('Agent data integrity check failed');
      }

      return agent;
    } catch (error) {
      throw new Error(`Failed to load agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all agents
   */
  async listAgents(): Promise<Array<{ id: string; name: string; description: string; created: Date; updated: Date; tags: string[] }>> {
    try {
      const metadata = await this.loadMetadata('agents');
      return Object.entries(metadata).map(([id, data]: [string, any]) => ({
        id,
        name: data.name,
        description: data.description,
        created: new Date(data.created),
        updated: new Date(data.updated),
        tags: data.tags || []
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    try {
      const agentPath = path.join(AgentStore.AGENTS_DIR, `${agentId}.json`);
      
      if (fs.existsSync(agentPath)) {
        // Secure deletion
        const fileSize = fs.statSync(agentPath).size;
        const randomData = Buffer.alloc(fileSize);
        randomData.fill(Math.floor(Math.random() * 256));
        fs.writeFileSync(agentPath, randomData);
        fs.unlinkSync(agentPath);
      }

      // Update metadata
      await this.removeFromMetadata('agents', agentId);
      
      console.log(`Agent '${agentId}' deleted securely`);
    } catch (error) {
      throw new Error(`Failed to delete agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save execution result
   */
  async saveExecution(execution: AgentExecution): Promise<void> {
    try {
      const key = await this.getEncryptionKey();
      const executionData = JSON.stringify(execution, null, 2);
      
      // Encrypt execution data
      const encrypted = CryptoManager.encrypt(executionData, key);
      
      // Save encrypted data
      const executionPath = path.join(AgentStore.EXECUTIONS_DIR, `${execution.id}.json`);
      const encryptedData = {
        encrypted: encrypted.encrypted.toString('base64'),
        iv: encrypted.iv.toString('base64'),
        tag: encrypted.tag.toString('base64'),
        version: '1.0',
        created: new Date().toISOString(),
        checksum: CryptoManager.createHash(executionData)
      };

      fs.writeFileSync(executionPath, JSON.stringify(encryptedData, null, 2));
      
      // Update metadata
      await this.updateMetadata('executions', execution.id, {
        agentId: execution.agentId,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        duration: execution.duration
      });

    } catch (error) {
      throw new Error(`Failed to save execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load execution result
   */
  async loadExecution(executionId: string): Promise<AgentExecution> {
    try {
      const executionPath = path.join(AgentStore.EXECUTIONS_DIR, `${executionId}.json`);
      
      if (!fs.existsSync(executionPath)) {
        throw new Error(`Execution with ID '${executionId}' not found`);
      }

      const encryptedData = JSON.parse(fs.readFileSync(executionPath, 'utf8'));
      const key = await this.getEncryptionKey();

      // Decrypt execution data
      const decrypted = CryptoManager.decrypt(
        Buffer.from(encryptedData.encrypted, 'base64'),
        key,
        Buffer.from(encryptedData.iv, 'base64'),
        Buffer.from(encryptedData.tag, 'base64')
      );

      const execution = JSON.parse(decrypted) as AgentExecution;
      
      // Verify checksum
      const expectedChecksum = CryptoManager.createHash(decrypted);
      if (!CryptoManager.constantTimeEquals(expectedChecksum, encryptedData.checksum)) {
        throw new Error('Execution data integrity check failed');
      }

      return execution;
    } catch (error) {
      throw new Error(`Failed to load execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List executions for an agent
   */
  async listExecutions(agentId?: string): Promise<Array<{ id: string; agentId: string; status: string; startTime: Date; endTime?: Date; duration?: number }>> {
    try {
      const metadata = await this.loadMetadata('executions');
      let executions = Object.entries(metadata).map(([id, data]: [string, any]) => ({
        id,
        agentId: data.agentId,
        status: data.status,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        duration: data.duration
      }));

      if (agentId) {
        executions = executions.filter(exec => exec.agentId === agentId);
      }

      return executions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    } catch (error) {
      return [];
    }
  }

  /**
   * Save agent template
   */
  async saveTemplate(template: AgentTemplate): Promise<void> {
    try {
      const templatePath = path.join(AgentStore.TEMPLATES_DIR, `${template.id}.json`);
      fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
      
      // Update metadata
      await this.updateMetadata('templates', template.id, {
        name: template.name,
        description: template.description,
        category: template.category,
        requiredVariables: template.requiredVariables,
        requiredTools: template.requiredTools
      });

      console.log(`Template '${template.name}' saved`);
    } catch (error) {
      throw new Error(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load agent template
   */
  async loadTemplate(templateId: string): Promise<AgentTemplate> {
    try {
      const templatePath = path.join(AgentStore.TEMPLATES_DIR, `${templateId}.json`);
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template with ID '${templateId}' not found`);
      }

      const template = JSON.parse(fs.readFileSync(templatePath, 'utf8')) as AgentTemplate;
      return template;
    } catch (error) {
      throw new Error(`Failed to load template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all templates
   */
  async listTemplates(): Promise<Array<{ id: string; name: string; description: string; category: string }>> {
    try {
      const metadata = await this.loadMetadata('templates');
      return Object.entries(metadata).map(([id, data]: [string, any]) => ({
        id,
        name: data.name,
        description: data.description,
        category: data.category
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Update metadata file
   */
  private async updateMetadata(type: string, id: string, data: any): Promise<void> {
    const metadata = await this.loadMetadata(type);
    metadata[id] = data;
    await this.saveMetadata(type, metadata);
  }

  /**
   * Remove from metadata
   */
  private async removeFromMetadata(type: string, id: string): Promise<void> {
    const metadata = await this.loadMetadata(type);
    delete metadata[id];
    await this.saveMetadata(type, metadata);
  }

  /**
   * Load metadata
   */
  private async loadMetadata(type: string): Promise<Record<string, any>> {
    try {
      const metadataPath = path.join(AgentStore.AGENTS_DIR, `${type}-${AgentStore.METADATA_FILE}`);
      if (fs.existsSync(metadataPath)) {
        return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      }
      return {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Save metadata
   */
  private async saveMetadata(type: string, metadata: Record<string, any>): Promise<void> {
    const metadataPath = path.join(AgentStore.AGENTS_DIR, `${type}-${AgentStore.METADATA_FILE}`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalAgents: number;
    totalExecutions: number;
    totalTemplates: number;
    storageSize: number;
    lastCleanup: Date;
  }> {
    try {
      const agents = await this.listAgents();
      const executions = await this.listExecutions();
      const templates = await this.listTemplates();

      // Calculate storage size
      let storageSize = 0;
      const dirs = [AgentStore.AGENTS_DIR, AgentStore.EXECUTIONS_DIR, AgentStore.TEMPLATES_DIR];
      
      for (const dir of dirs) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            storageSize += stats.size;
          }
        }
      }

      return {
        totalAgents: agents.length,
        totalExecutions: executions.length,
        totalTemplates: templates.length,
        storageSize,
        lastCleanup: new Date() // TODO: Implement actual cleanup tracking
      };
    } catch (error) {
      throw new Error(`Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cleanup old executions
   */
  async cleanupOldExecutions(maxAge: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAge);
      
      const executions = await this.listExecutions();
      let cleaned = 0;

      for (const execution of executions) {
        if (execution.startTime < cutoffDate) {
          const executionPath = path.join(AgentStore.EXECUTIONS_DIR, `${execution.id}.json`);
          if (fs.existsSync(executionPath)) {
            fs.unlinkSync(executionPath);
            cleaned++;
          }
        }
      }

      // Update metadata to remove cleaned executions
      const metadata = await this.loadMetadata('executions');
      const updatedMetadata: Record<string, any> = {};
      
      for (const [id, data] of Object.entries(metadata)) {
        const startTime = new Date(data.startTime);
        if (startTime >= cutoffDate) {
          updatedMetadata[id] = data;
        }
      }
      
      await this.saveMetadata('executions', updatedMetadata);
      
      return cleaned;
    } catch (error) {
      throw new Error(`Failed to cleanup executions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}