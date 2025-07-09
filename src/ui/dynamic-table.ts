import chalk from 'chalk';
import Table from 'cli-table3';

export interface ModelResult {
  model: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  tokensPerSecond?: number;
  error?: string;
  response?: string;
}

export class DynamicResultsTable {
  private table: Table.Table;
  private results: Map<string, ModelResult> = new Map();
  private isStreaming: boolean;

  constructor(models: string[], isStreaming: boolean) {
    this.isStreaming = isStreaming;
    
    const headers = ['Model', 'Status'];
    if (isStreaming) {
      headers.push('Duration', 'Speed', 'Tokens');
    } else {
      headers.push('Duration', 'Input Tokens', 'Output Tokens', 'Total Tokens');
    }

    this.table = new Table({
      head: headers,
      style: { head: ['cyan'] },
      colWidths: isStreaming ? [25, 12, 12, 12, 12] : [25, 12, 12, 12, 12, 12]
    });

    // Initialize all models as pending
    models.forEach(model => {
      const modelName = model.split('/').slice(1).join('/');
      this.results.set(model, {
        model: modelName,
        status: 'pending'
      });
    });

    this.renderTable();
  }

  updateModel(modelId: string, update: Partial<ModelResult>) {
    const existing = this.results.get(modelId);
    if (existing) {
      const wasCompleted = existing.status === 'completed' || existing.status === 'failed';
      const newResult = { ...existing, ...update };
      const isNowCompleted = newResult.status === 'completed' || newResult.status === 'failed';
      
      this.results.set(modelId, newResult);
      
      // Only update table if streaming or if status meaningfully changed
      if (this.isStreaming || (!wasCompleted && isNowCompleted)) {
        this.renderTable();
      }
    }
  }

  private tableInitialized = false;
  private modelOrder: string[] = [];

  private renderTable() {
    if (!this.tableInitialized) {
      // First time - show header and initial table
      console.log(chalk.green('📊 Live Results:'));
      console.log();
      this.tableInitialized = true;
      this.renderFullTable();
    } else {
      // Update existing table in place
      if (this.isStreaming) {
        this.updateTableInPlace();
      } else {
        // For non-streaming, just update the specific rows that changed
        this.updateNonStreamingTable();
      }
    }
  }

  private renderFullTable() {
    // Clear table rows
    this.table.length = 0;
    this.modelOrder = [];

    // Add current results
    Array.from(this.results.values()).forEach(result => {
      this.modelOrder.push(result.model);
      const statusIcon = this.getStatusIcon(result.status);
      const statusText = `${statusIcon} ${result.status}`;

      if (this.isStreaming) {
        this.table.push([
          result.model,
          statusText,
          result.duration ? `${result.duration}ms` : '-',
          result.tokensPerSecond ? `${result.tokensPerSecond.toFixed(0)} tok/s` : '-',
          result.totalTokens ? result.totalTokens.toString() : '-'
        ]);
      } else {
        this.table.push([
          result.model,
          statusText,
          result.duration ? `${result.duration}ms` : '-',
          result.inputTokens ? result.inputTokens.toString() : '-',
          result.outputTokens ? result.outputTokens.toString() : '-',
          result.totalTokens ? result.totalTokens.toString() : '-'
        ]);
      }
    });

    console.log(this.table.toString());
    console.log();
  }

  private updateTableInPlace() {
    // For streaming, we can do more frequent updates
    // Move cursor up to overwrite table
    const tableLines = this.table.length + 4; // table rows + borders + spacing
    process.stdout.write(`\x1b[${tableLines}A`); // Move cursor up
    
    this.renderFullTable();
  }

  private updateNonStreamingTable() {
    // For non-streaming, only update when status actually changes
    // This prevents flickering and is more stable
    // We'll just redraw less frequently and only when meaningful changes occur
    
    // Simple approach: only redraw if we have completed models
    const hasCompleted = Array.from(this.results.values()).some(r => r.status === 'completed' || r.status === 'failed');
    
    if (hasCompleted) {
      // Move cursor up to overwrite table
      const tableLines = this.table.length + 4; // table rows + borders + spacing
      process.stdout.write(`\x1b[${tableLines}A`); // Move cursor up
      this.renderFullTable();
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return chalk.gray('⏳');
      case 'running': return chalk.yellow('🔄');
      case 'completed': return chalk.green('✅');
      case 'failed': return chalk.red('❌');
      default: return chalk.gray('•');
    }
  }

  showCompletedResponses() {
    console.log(chalk.blue('📝 All Responses:'));
    console.log();

    Array.from(this.results.values()).forEach(result => {
      if (result.status === 'completed' && result.response) {
        console.log(chalk.blue(`▶ ${result.model}:`));
        console.log(chalk.dim('─'.repeat(60)));
        console.log(result.response);
        console.log(chalk.dim('─'.repeat(60)));
        console.log();
      }
    });
  }

  showFinalSummary() {
    const completed = Array.from(this.results.values()).filter(r => r.status === 'completed');
    const failed = Array.from(this.results.values()).filter(r => r.status === 'failed');
    const total = this.results.size;

    console.log(chalk.green('🎯 Final Summary:'));
    console.log(`${chalk.green('✅ Successful:')} ${completed.length}/${total}`);
    console.log(`${chalk.red('❌ Failed:')} ${failed.length}/${total}`);
    
    if (completed.length > 0) {
      const avgDuration = completed.reduce((sum, r) => sum + (r.duration || 0), 0) / completed.length;
      console.log(`${chalk.cyan('⚡ Average Duration:')} ${avgDuration.toFixed(0)}ms`);
      
      if (this.isStreaming) {
        const avgSpeed = completed.reduce((sum, r) => sum + (r.tokensPerSecond || 0), 0) / completed.length;
        console.log(`${chalk.cyan('🚀 Average Speed:')} ${avgSpeed.toFixed(0)} tokens/sec`);
      } else {
        const totalInputTokens = completed.reduce((sum, r) => sum + (r.inputTokens || 0), 0);
        const totalOutputTokens = completed.reduce((sum, r) => sum + (r.outputTokens || 0), 0);
        console.log(`${chalk.cyan('📥 Total Input Tokens:')} ${totalInputTokens}`);
        console.log(`${chalk.cyan('📤 Total Output Tokens:')} ${totalOutputTokens}`);
      }
    }
    console.log();
  }
}