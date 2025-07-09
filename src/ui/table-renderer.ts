import chalk from 'chalk';
import Table from 'cli-table3';
import { ModelResult } from '../core/types';
import { PricingCalculator } from '../utils/pricing';

export class TableRenderer {
  private table: Table.Table;
  private isStreaming: boolean;
  private headerShown: boolean = false;
  private lastTableHeight: number = 0;

  constructor(models: string[], isStreaming: boolean) {
    this.isStreaming = isStreaming;
    
    const headers = ['Model', 'Status'];
    if (isStreaming) {
      headers.push('Duration', 'Speed', 'Tokens');
    } else {
      headers.push('Duration', 'Input Tokens', 'Output Tokens', 'Reasoning Tokens', 'Total Tokens', 'Actual Cost', 'Blended $/M');
    }

    this.table = new Table({
      head: headers,
      style: { head: ['cyan'] },
      colWidths: isStreaming ? [25, 40, 12, 12, 12] : [25, 40, 12, 12, 12, 12, 12, 12, 12]
    });
  }

  showHeader(): void {
    if (!this.headerShown) {
      console.log(chalk.green('📊 Live Results:'));
      console.log();
      this.headerShown = true;
    }
  }

  renderTable(results: Map<string, ModelResult>): void {
    this.showHeader();
    
    // Clear previous table if it exists
    if (this.lastTableHeight > 0) {
      this.clearPreviousTable();
    }

    // Clear and rebuild table
    this.table.length = 0;
    this.buildTableRows(results);
    
    // Render the table
    const tableOutput = this.table.toString();
    console.log(tableOutput);
    console.log();
    
    // Store the height for next clear operation
    this.lastTableHeight = tableOutput.split('\n').length + 1; // +1 for the empty line
  }

  private clearPreviousTable(): void {
    // Move cursor up and clear each line
    for (let i = 0; i < this.lastTableHeight; i++) {
      process.stdout.write('\x1b[1A'); // Move cursor up one line
      process.stdout.write('\x1b[2K'); // Clear the entire line
    }
  }

  private buildTableRows(results: Map<string, ModelResult>): void {
    Array.from(results.values()).forEach(result => {
      const statusIcon = this.getStatusIcon(result.status);
      let statusText = `${statusIcon} ${result.status || 'unknown'}`;
      
      // Add error message for failed requests
      if (result.status === 'failed' && result.error) {
        // Show more of the error message, and only truncate if it's really long
        const errorMessage = result.error.length > 100 ? 
          result.error.substring(0, 100) + '...' : 
          result.error;
        statusText = `${statusIcon} ${errorMessage}`;
      }

      if (this.isStreaming) {
        this.table.push([
          result.model,
          statusText,
          result.duration ? `${result.duration}ms` : '-',
          result.tokensPerSecond ? `${result.tokensPerSecond.toFixed(0)} tok/s` : '-',
          result.totalTokens ? result.totalTokens.toString() : '-'
        ]);
      } else {
        const actualCost = result.actualCost !== undefined 
          ? PricingCalculator.formatActualCost(result.actualCost)
          : '-';
        const blendedCost = result.blendedCostPerMillion !== undefined 
          ? PricingCalculator.formatCostPerMillion(result.blendedCostPerMillion)
          : '-';
        
        this.table.push([
          result.model,
          statusText,
          result.duration ? `${result.duration}ms` : '-',
          result.inputTokens ? result.inputTokens.toString() : '-',
          result.outputTokens ? result.outputTokens.toString() : '-',
          result.reasoningTokens && result.reasoningTokens > 0 ? result.reasoningTokens.toString() : '-',
          result.totalTokens ? result.totalTokens.toString() : '-',
          actualCost,
          blendedCost
        ]);
      }
    });
  }

  private getStatusIcon(status: string | undefined): string {
    switch (status) {
      case 'pending': return chalk.gray('⏳');
      case 'running': return chalk.yellow('🔄');
      case 'completed': return chalk.green('✅');
      case 'failed': return chalk.red('❌');
      default: return chalk.gray('•');
    }
  }
}