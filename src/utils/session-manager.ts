import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface RequestyMetadata {
  user_id: string;
  trace_id: string;
  mode: 'model_comparison' | 'prompt_comparison' | 'pdf_chat' | 'chat';
  extra?: Record<string, any>;
}

export class SessionManager {
  private static instance: SessionManager;
  private userId: string;
  private currentTraceId: string | null = null;
  private currentMode: RequestyMetadata['mode'] | null = null;
  private userConfigPath: string;

  private constructor() {
    // Store user config in home directory
    this.userConfigPath = path.join(os.homedir(), '.requesty-cli', 'user.json');
    this.userId = this.loadOrCreateUserId();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private loadOrCreateUserId(): string {
    try {
      // Ensure directory exists
      const configDir = path.dirname(this.userConfigPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Try to load existing user ID
      if (fs.existsSync(this.userConfigPath)) {
        const userData = JSON.parse(fs.readFileSync(this.userConfigPath, 'utf8'));
        if (userData.user_id && typeof userData.user_id === 'string') {
          return userData.user_id;
        }
      }

      // Create new user ID
      const newUserId = uuidv4();
      const userData = {
        user_id: newUserId,
        created: new Date().toISOString(),
        version: '1.0.0'
      };

      fs.writeFileSync(this.userConfigPath, JSON.stringify(userData, null, 2));
      return newUserId;

    } catch (error) {
      // Fallback to session-only UUID if file operations fail
      console.warn('Warning: Could not persist user ID, using session-only ID');
      return uuidv4();
    }
  }

  startSession(mode: RequestyMetadata['mode']): string {
    this.currentTraceId = uuidv4();
    this.currentMode = mode;
    return this.currentTraceId;
  }

  endSession(): void {
    this.currentTraceId = null;
    this.currentMode = null;
  }

  getMetadata(extra?: Record<string, any>): RequestyMetadata {
    if (!this.currentTraceId || !this.currentMode) {
      throw new Error('No active session. Call startSession() first.');
    }

    return {
      user_id: this.userId,
      trace_id: this.currentTraceId,
      mode: this.currentMode,
      extra: extra || {}
    };
  }

  getRequestyExtraBody(extra?: Record<string, any>) {
    const metadata = this.getMetadata(extra);
    
    return {
      requesty: {
        tags: [`requesty-cli`, `mode:${metadata.mode}`],
        user_id: metadata.user_id,
        trace_id: metadata.trace_id,
        extra: {
          cli_version: '2.0.0',
          mode: metadata.mode,
          timestamp: new Date().toISOString(),
          ...metadata.extra
        }
      }
    };
  }

  getRequestyMetadata(extra?: Record<string, any>) {
    const metadata = this.getMetadata(extra);
    
    return {
      user_id: metadata.user_id,
      trace_id: metadata.trace_id,
      extra: {
        mode: metadata.mode
      }
    };
  }

  getUserId(): string {
    return this.userId;
  }

  getCurrentTraceId(): string | null {
    return this.currentTraceId;
  }

  getCurrentMode(): RequestyMetadata['mode'] | null {
    return this.currentMode;
  }
}