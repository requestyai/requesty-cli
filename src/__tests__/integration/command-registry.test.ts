/**
 * Integration tests for Command Registry
 */

import { CommandRegistry } from '../../cli/commands/command-registry';
import { BaseCommand } from '../../cli/commands/base-command';
import { RequestyAPI } from '../../core/api';
import { TerminalUI } from '../../ui/terminal-ui';
import { TestUtils } from '../test-utils';

// Mock dependencies
jest.mock('../../core/api');
jest.mock('../../ui/terminal-ui');
jest.mock('../../cli/commands/quick-start-command');
jest.mock('../../cli/commands/model-selection-command');

// Mock the terminal UI
const MockTerminalUI = TerminalUI as jest.MockedClass<typeof TerminalUI>;
const MockRequestyAPI = RequestyAPI as jest.MockedClass<typeof RequestyAPI>;

describe('CommandRegistry Integration Tests', () => {
  let registry: CommandRegistry;
  let mockAPI: jest.Mocked<RequestyAPI>;
  let mockUI: jest.Mocked<TerminalUI>;

  beforeEach(() => {
    mockAPI = new MockRequestyAPI({}) as jest.Mocked<RequestyAPI>;
    mockUI = new MockTerminalUI() as jest.Mocked<TerminalUI>;
    
    // Mock UI methods
    mockUI.displayHeader = jest.fn();
    mockUI.displayInfo = jest.fn();
    mockUI.displayTable = jest.fn();
    mockUI.displayError = jest.fn();
    
    registry = new CommandRegistry(mockAPI, mockUI);
  });

  describe('command registration', () => {
    class TestCommand extends BaseCommand {
      constructor() {
        super('test-command', 'Test command description');
      }

      protected async run(args: any[]): Promise<any> {
        return { success: true, message: 'Test command executed' };
      }

      protected getCategory(): string {
        return 'test';
      }
    }

    it('should register a new command successfully', () => {
      const command = new TestCommand();
      
      expect(() => {
        registry.register(command);
      }).not.toThrow();
      
      expect(registry.hasCommand('test-command')).toBe(true);
    });

    it('should throw error when registering duplicate command', () => {
      const command1 = new TestCommand();
      const command2 = new TestCommand();
      
      registry.register(command1);
      
      expect(() => {
        registry.register(command2);
      }).toThrow('Command test-command is already registered');
    });

    it('should register command aliases', () => {
      const command = new TestCommand();
      registry.register(command);
      
      expect(() => {
        registry.registerAlias('tc', 'test-command');
      }).not.toThrow();
      
      expect(registry.hasCommand('tc')).toBe(true);
      expect(registry.getCommand('tc')).toBe(command);
    });

    it('should throw error when registering alias for non-existent command', () => {
      expect(() => {
        registry.registerAlias('tc', 'non-existent-command');
      }).toThrow('Cannot create alias tc for non-existent command non-existent-command');
    });
  });

  describe('command execution', () => {
    class MockCommand extends BaseCommand {
      public executeCalled = false;
      public executeArgs: any[] = [];

      constructor(name: string, shouldFail = false) {
        super(name, `Mock command: ${name}`);
        this.shouldFail = shouldFail;
      }

      private shouldFail: boolean;

      protected async run(args: any[]): Promise<any> {
        this.executeCalled = true;
        this.executeArgs = args;
        
        if (this.shouldFail) {
          throw new Error('Mock command failed');
        }
        
        return { success: true, data: 'Mock result' };
      }
    }

    it('should execute registered command successfully', async () => {
      const command = new MockCommand('success-command');
      registry.register(command);
      
      await registry.execute('success-command', ['arg1', 'arg2']);
      
      expect(command.executeCalled).toBe(true);
      expect(command.executeArgs).toEqual(['arg1', 'arg2']);
    });

    it('should execute command via alias', async () => {
      const command = new MockCommand('aliased-command');
      registry.register(command);
      registry.registerAlias('ac', 'aliased-command');
      
      await registry.execute('ac', ['test-arg']);
      
      expect(command.executeCalled).toBe(true);
      expect(command.executeArgs).toEqual(['test-arg']);
    });

    it('should handle command execution errors', async () => {
      const command = new MockCommand('failing-command', true);
      registry.register(command);
      
      await expect(registry.execute('failing-command')).rejects.toThrow(
        'Command execution: failing-command: Mock command failed'
      );
    });

    it('should handle non-existent command execution', async () => {
      await expect(registry.execute('non-existent')).rejects.toThrow(
        'Command execution: non-existent: Command not found: non-existent'
      );
    });
  });

  describe('command management', () => {
    class TestCommand1 extends BaseCommand {
      constructor() {
        super('test1', 'Test command 1');
      }
      protected async run(): Promise<any> { return {}; }
      protected getCategory(): string { return 'test'; }
    }

    class TestCommand2 extends BaseCommand {
      constructor() {
        super('test2', 'Test command 2');
      }
      protected async run(): Promise<any> { return {}; }
      protected getCategory(): string { return 'utilities'; }
    }

    it('should unregister commands', () => {
      const command = new TestCommand1();
      registry.register(command);
      registry.registerAlias('t1', 'test1');
      
      expect(registry.hasCommand('test1')).toBe(true);
      expect(registry.hasCommand('t1')).toBe(true);
      
      const removed = registry.unregister('test1');
      
      expect(removed).toBe(true);
      expect(registry.hasCommand('test1')).toBe(false);
      expect(registry.hasCommand('t1')).toBe(false); // Alias should be removed too
    });

    it('should return false when unregistering non-existent command', () => {
      const removed = registry.unregister('non-existent');
      expect(removed).toBe(false);
    });

    it('should get all commands', () => {
      const command1 = new TestCommand1();
      const command2 = new TestCommand2();
      
      registry.register(command1);
      registry.register(command2);
      
      const commands = registry.getCommands();
      
      expect(commands.length).toBeGreaterThanOrEqual(2);
      expect(commands.some(cmd => cmd.name === 'test1')).toBe(true);
      expect(commands.some(cmd => cmd.name === 'test2')).toBe(true);
    });

    it('should get commands by category', () => {
      const command1 = new TestCommand1();
      const command2 = new TestCommand2();
      
      registry.register(command1);
      registry.register(command2);
      
      const testCommands = registry.getCommandsByCategory('test');
      const utilityCommands = registry.getCommandsByCategory('utilities');
      
      expect(testCommands.some(cmd => cmd.name === 'test1')).toBe(true);
      expect(utilityCommands.some(cmd => cmd.name === 'test2')).toBe(true);
    });

    it('should get all aliases', () => {
      const command = new TestCommand1();
      registry.register(command);
      registry.registerAlias('t1', 'test1');
      registry.registerAlias('tc1', 'test1');
      
      const aliases = registry.getAliases();
      
      expect(aliases.get('t1')).toBe('test1');
      expect(aliases.get('tc1')).toBe('test1');
    });
  });

  describe('command suggestions', () => {
    class TestCommand extends BaseCommand {
      constructor(name: string) {
        super(name, `Test command: ${name}`);
      }
      protected async run(): Promise<any> { return {}; }
    }

    it('should provide command suggestions', () => {
      const commands = [
        new TestCommand('start'),
        new TestCommand('stop'),
        new TestCommand('status'),
        new TestCommand('restart')
      ];
      
      commands.forEach(cmd => registry.register(cmd));
      registry.registerAlias('st', 'start');
      
      const suggestions = registry.getSuggestions('st');
      
      expect(suggestions).toContain('start');
      expect(suggestions).toContain('stop');
      expect(suggestions).toContain('status');
      expect(suggestions).toContain('st');
    });

    it('should prioritize exact matches and prefix matches', () => {
      const commands = [
        new TestCommand('test'),
        new TestCommand('testing'),
        new TestCommand('contest')
      ];
      
      commands.forEach(cmd => registry.register(cmd));
      
      const suggestions = registry.getSuggestions('test');
      
      expect(suggestions[0]).toBe('test'); // Exact match should be first
      expect(suggestions[1]).toBe('testing'); // Prefix match should be second
    });
  });

  describe('help system', () => {
    it('should display general help', () => {
      registry.displayHelp();
      
      expect(mockUI.displayHeader).toHaveBeenCalledWith('🎯 Available Commands');
      expect(mockUI.displayInfo).toHaveBeenCalled();
      expect(mockUI.displayTable).toHaveBeenCalled();
    });

    it('should display command-specific help', () => {
      class TestCommand extends BaseCommand {
        constructor() {
          super('test-help', 'Test help command');
        }
        protected async run(): Promise<any> { return {}; }
        
        displayHelp(): void {
          console.log('Test command help');
        }
      }
      
      const command = new TestCommand();
      const helpSpy = jest.spyOn(command, 'displayHelp');
      
      registry.register(command);
      registry.displayCommandHelp('test-help');
      
      expect(helpSpy).toHaveBeenCalled();
    });

    it('should display error for non-existent command help', () => {
      registry.displayCommandHelp('non-existent');
      
      expect(mockUI.displayError).toHaveBeenCalledWith('Command not found: non-existent');
    });
  });

  describe('registry statistics', () => {
    class TestCommand extends BaseCommand {
      constructor(name: string, category: string, requiresAuth = true, requiresInteraction = true) {
        super(name, `Test command: ${name}`);
        this.testCategory = category;
        this.testRequiresAuth = requiresAuth;
        this.testRequiresInteraction = requiresInteraction;
      }
      
      private testCategory: string;
      private testRequiresAuth: boolean;
      private testRequiresInteraction: boolean;
      
      protected async run(): Promise<any> { return {}; }
      protected getCategory(): string { return this.testCategory; }
      protected requiresAuthentication(): boolean { return this.testRequiresAuth; }
      protected requiresUserInteraction(): boolean { return this.testRequiresInteraction; }
    }

    it('should return accurate registry statistics', () => {
      const commands = [
        new TestCommand('cmd1', 'category1', true, true),
        new TestCommand('cmd2', 'category1', false, true),
        new TestCommand('cmd3', 'category2', true, false)
      ];
      
      commands.forEach(cmd => registry.register(cmd));
      registry.registerAlias('c1', 'cmd1');
      registry.registerAlias('c2', 'cmd2');
      
      const stats = registry.getStats();
      
      expect(stats.totalCommands).toBeGreaterThanOrEqual(3);
      expect(stats.totalAliases).toBeGreaterThanOrEqual(2);
      expect(stats.categories).toBeGreaterThanOrEqual(2);
      expect(stats.commandsByCategory.some(cat => cat.category === 'category1')).toBe(true);
      expect(stats.commandsByCategory.some(cat => cat.category === 'category2')).toBe(true);
    });
  });

  describe('default commands', () => {
    it('should register default commands on initialization', () => {
      // The registry should have default commands registered
      expect(registry.hasCommand('quick-start')).toBe(true);
      expect(registry.hasCommand('model-selection')).toBe(true);
      
      // Should have aliases
      expect(registry.hasCommand('qs')).toBe(true);
      expect(registry.hasCommand('ms')).toBe(true);
      expect(registry.hasCommand('select')).toBe(true);
      expect(registry.hasCommand('test')).toBe(true);
    });
  });
});