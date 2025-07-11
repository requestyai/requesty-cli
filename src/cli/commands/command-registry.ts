import { BaseCommand, CommandMetadata } from './base-command';
import { QuickStartCommand } from './quick-start-command';
import { ModelSelectionCommand } from './model-selection-command';
import { ChatCommand } from './chat-command';
import { RequestyAPI } from '../../core/api';
import { TerminalUI } from '../../ui/terminal-ui';
import { ErrorHandler } from '../../utils/error-handler';
import { CLIConfig } from '../../core/types';

/**
 * Command registry for managing all CLI commands
 * Provides command registration, discovery, and execution
 */
export class CommandRegistry {
  private commands: Map<string, BaseCommand> = new Map();
  private aliases: Map<string, string> = new Map();
  private api: RequestyAPI;
  private ui: TerminalUI;
  private config: CLIConfig;

  constructor(api: RequestyAPI, ui: TerminalUI, config: CLIConfig) {
    this.api = api;
    this.ui = ui;
    this.config = config;
    this.registerDefaultCommands();
  }

  /**
   * Register default commands
   */
  private registerDefaultCommands(): void {
    // Register core commands
    this.register(new QuickStartCommand(this.api, this.ui));
    this.register(new ModelSelectionCommand(this.api, this.ui));
    this.register(new ChatCommand(this.api, this.ui, this.config));
    
    // Register aliases
    this.registerAlias('qs', 'quick-start');
    this.registerAlias('ms', 'model-selection');
    this.registerAlias('select', 'model-selection');
    this.registerAlias('test', 'quick-start');
    this.registerAlias('c', 'chat');
    this.registerAlias('conversation', 'chat');
  }

  /**
   * Register a command
   * @param command - Command to register
   */
  register(command: BaseCommand): void {
    const metadata = command.getMetadata();
    
    if (this.commands.has(metadata.name)) {
      throw new Error(`Command ${metadata.name} is already registered`);
    }
    
    this.commands.set(metadata.name, command);
    this.log(`Registered command: ${metadata.name}`);
  }

  /**
   * Register a command alias
   * @param alias - Alias name
   * @param commandName - Target command name
   */
  registerAlias(alias: string, commandName: string): void {
    if (this.aliases.has(alias)) {
      throw new Error(`Alias ${alias} is already registered`);
    }
    
    if (!this.commands.has(commandName)) {
      throw new Error(`Cannot create alias ${alias} for non-existent command ${commandName}`);
    }
    
    this.aliases.set(alias, commandName);
    this.log(`Registered alias: ${alias} -> ${commandName}`);
  }

  /**
   * Unregister a command
   * @param commandName - Name of command to unregister
   * @returns True if command was unregistered
   */
  unregister(commandName: string): boolean {
    const removed = this.commands.delete(commandName);
    
    // Remove any aliases pointing to this command
    for (const [alias, target] of this.aliases.entries()) {
      if (target === commandName) {
        this.aliases.delete(alias);
      }
    }
    
    if (removed) {
      this.log(`Unregistered command: ${commandName}`);
    }
    
    return removed;
  }

  /**
   * Execute a command
   * @param commandName - Name of command to execute
   * @param args - Command arguments
   * @returns Promise that resolves when command completes
   */
  async execute(commandName: string, args: any[] = []): Promise<void> {
    try {
      const command = this.getCommand(commandName);
      
      if (!command) {
        throw new Error(`Command not found: ${commandName}`);
      }
      
      // Log command execution
      this.log(`Executing command: ${commandName} with args: ${JSON.stringify(args)}`);
      
      // Execute command
      await command.execute(args);
      
      this.log(`Command completed: ${commandName}`);
    } catch (error) {
      ErrorHandler.handleApiError(error, `Command execution: ${commandName}`);
    }
  }

  /**
   * Get a command by name or alias
   * @param nameOrAlias - Command name or alias
   * @returns Command instance or null if not found
   */
  getCommand(nameOrAlias: string): BaseCommand | null {
    // Check direct command name
    if (this.commands.has(nameOrAlias)) {
      return this.commands.get(nameOrAlias)!;
    }
    
    // Check alias
    const commandName = this.aliases.get(nameOrAlias);
    if (commandName && this.commands.has(commandName)) {
      return this.commands.get(commandName)!;
    }
    
    return null;
  }

  /**
   * Check if a command exists
   * @param nameOrAlias - Command name or alias
   * @returns True if command exists
   */
  hasCommand(nameOrAlias: string): boolean {
    return this.getCommand(nameOrAlias) !== null;
  }

  /**
   * Get all registered commands
   * @returns Array of command metadata
   */
  getCommands(): CommandMetadata[] {
    return Array.from(this.commands.values()).map(cmd => cmd.getMetadata());
  }

  /**
   * Get commands by category
   * @param category - Category to filter by
   * @returns Array of command metadata in the category
   */
  getCommandsByCategory(category: string): CommandMetadata[] {
    return this.getCommands().filter(cmd => cmd.category === category);
  }

  /**
   * Get all aliases
   * @returns Map of aliases to command names
   */
  getAliases(): Map<string, string> {
    return new Map(this.aliases);
  }

  /**
   * Display help for all commands
   */
  displayHelp(): void {
    this.ui.displayHeader('🎯 Available Commands');
    
    // Group commands by category
    const categories = this.groupCommandsByCategory();
    
    for (const [category, commands] of Object.entries(categories)) {
      this.ui.displayInfo(`\n📦 ${category.toUpperCase()} Commands:`);
      
      const tableData = commands.map(cmd => ({
        'Command': cmd.name,
        'Description': cmd.description,
        'Auth Required': cmd.requiresAuth ? '✅' : '❌',
        'Interactive': cmd.requiresInteraction ? '✅' : '❌'
      }));
      
      this.ui.displayTable(tableData);
    }
    
    // Display aliases
    if (this.aliases.size > 0) {
      this.ui.displayInfo('\n🔗 Aliases:');
      const aliasData = Array.from(this.aliases.entries()).map(([alias, command]) => ({
        'Alias': alias,
        'Command': command
      }));
      this.ui.displayTable(aliasData);
    }
    
    this.ui.displayInfo('\nUse "requesty <command> --help" for detailed help on a specific command.');
  }

  /**
   * Display help for a specific command
   * @param commandName - Name of command to show help for
   */
  displayCommandHelp(commandName: string): void {
    const command = this.getCommand(commandName);
    
    if (!command) {
      this.ui.displayError(`Command not found: ${commandName}`);
      return;
    }
    
    command.displayHelp();
  }

  /**
   * Group commands by category
   * @returns Grouped commands
   */
  private groupCommandsByCategory(): Record<string, CommandMetadata[]> {
    const commands = this.getCommands();
    
    return commands.reduce((groups, cmd) => {
      const category = cmd.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cmd);
      return groups;
    }, {} as Record<string, CommandMetadata[]>);
  }

  /**
   * Get command suggestions for a partial name
   * @param partialName - Partial command name
   * @returns Array of suggested command names
   */
  getSuggestions(partialName: string): string[] {
    const allNames = [
      ...Array.from(this.commands.keys()),
      ...Array.from(this.aliases.keys())
    ];
    
    return allNames
      .filter(name => name.includes(partialName.toLowerCase()))
      .sort((a, b) => {
        // Prioritize exact matches and prefix matches
        const aStarts = a.startsWith(partialName);
        const bStarts = b.startsWith(partialName);
        
        if (aStarts && !bStarts) {return -1;}
        if (!aStarts && bStarts) {return 1;}
        
        return a.localeCompare(b);
      });
  }

  /**
   * Get registry statistics
   * @returns Registry statistics
   */
  getStats(): RegistryStats {
    const commands = this.getCommands();
    const categories = this.groupCommandsByCategory();
    
    return {
      totalCommands: commands.length,
      totalAliases: this.aliases.size,
      categories: Object.keys(categories).length,
      commandsByCategory: Object.entries(categories).map(([category, cmds]) => ({
        category,
        count: cmds.length
      })),
      authRequiredCount: commands.filter(cmd => cmd.requiresAuth).length,
      interactiveCount: commands.filter(cmd => cmd.requiresInteraction).length
    };
  }

  /**
   * Log registry messages
   * @param message - Message to log
   */
  private log(message: string): void {
    // Only log in debug mode
    if (process.env.DEBUG) {
      console.log(`[CommandRegistry] ${message}`);
    }
  }
}

/**
 * Registry statistics interface
 */
export interface RegistryStats {
  totalCommands: number;
  totalAliases: number;
  categories: number;
  commandsByCategory: Array<{
    category: string;
    count: number;
  }>;
  authRequiredCount: number;
  interactiveCount: number;
}