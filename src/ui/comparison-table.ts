import chalk from 'chalk';
import Table from 'cli-table3';
import { ModelInfo } from '../core/types';

interface ComparisonResult {
  model: string;
  prompt1: {
    status: 'pending' | 'running' | 'completed' | 'failed';
    duration?: number;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    reasoningTokens?: number;
    actualCost?: number;
    response?: string;
    error?: string;
    tokensPerSecond?: number;
  };
  prompt2: {
    status: 'pending' | 'running' | 'completed' | 'failed';
    duration?: number;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    reasoningTokens?: number;
    actualCost?: number;
    response?: string;
    error?: string;
    tokensPerSecond?: number;
  };
  modelInfo?: ModelInfo;
}

export class ComparisonTable {
  private results: Map<string, ComparisonResult> = new Map();
  private isStreaming: boolean;
  private prompt1Text: string;
  private prompt2Text: string;

  constructor(models: string[], isStreaming: boolean, prompt1: string, prompt2: string) {
    this.isStreaming = isStreaming;
    this.prompt1Text = prompt1;
    this.prompt2Text = prompt2;
    
    // Initialize results for all models
    models.forEach(model => {
      this.results.set(model, {
        model,
        prompt1: { status: 'pending' },
        prompt2: { status: 'pending' }
      });
    });
  }

  updateModel(model: string, promptType: 'prompt1' | 'prompt2', update: Partial<ComparisonResult['prompt1']>) {
    const result = this.results.get(model);
    if (result) {
      result[promptType] = { ...result[promptType], ...update };
      this.render();
    }
  }

  setModelInfo(model: string, modelInfo: ModelInfo) {
    const result = this.results.get(model);
    if (result) {
      result.modelInfo = modelInfo;
    }
  }

  private render() {
    console.clear();
    console.log(chalk.cyan.bold('⚡ Prompt Comparison Results\n'));
    
    // Show prompts being compared
    console.log(chalk.yellow('📝 Prompts Being Compared:'));
    console.log(chalk.gray(`Prompt 1: ${this.prompt1Text.slice(0, 100)}${this.prompt1Text.length > 100 ? '...' : ''}`));
    console.log(chalk.gray(`Prompt 2: ${this.prompt2Text.slice(0, 100)}${this.prompt2Text.length > 100 ? '...' : ''}\n`));

    const table = new Table({
      head: [
        'Model',
        'Prompt 1 Status',
        'Prompt 1 Time',
        'Prompt 1 Cost',
        'Prompt 2 Status', 
        'Prompt 2 Time',
        'Prompt 2 Cost',
        'Speed Diff',
        'Cost Diff'
      ],
      style: { head: ['cyan'] },
      colWidths: [20, 15, 12, 12, 15, 12, 12, 12, 12]
    });

    const sortedResults = Array.from(this.results.values()).sort((a, b) => {
      const aCompleted = (a.prompt1.status === 'completed' ? 1 : 0) + (a.prompt2.status === 'completed' ? 1 : 0);
      const bCompleted = (b.prompt1.status === 'completed' ? 1 : 0) + (b.prompt2.status === 'completed' ? 1 : 0);
      return bCompleted - aCompleted;
    });

    sortedResults.forEach(result => {
      const p1 = result.prompt1;
      const p2 = result.prompt2;
      
      // Status formatting
      const p1Status = this.formatStatus(p1.status, p1.tokensPerSecond);
      const p2Status = this.formatStatus(p2.status, p2.tokensPerSecond);
      
      // Time formatting
      const p1Time = p1.duration ? `${p1.duration}ms` : '-';
      const p2Time = p2.duration ? `${p2.duration}ms` : '-';
      
      // Cost formatting
      const p1Cost = p1.actualCost ? `$${p1.actualCost.toFixed(6)}` : '-';
      const p2Cost = p2.actualCost ? `$${p2.actualCost.toFixed(6)}` : '-';
      
      // Comparison calculations
      let speedDiff = '-';
      let costDiff = '-';
      
      if (p1.duration && p2.duration) {
        const speedRatio = p1.duration / p2.duration;
        if (speedRatio > 1) {
          speedDiff = chalk.green(`${speedRatio.toFixed(2)}x faster`);
        } else {
          speedDiff = chalk.red(`${(1/speedRatio).toFixed(2)}x slower`);
        }
      }
      
      if (p1.actualCost && p2.actualCost) {
        const costRatio = p1.actualCost / p2.actualCost;
        if (costRatio < 1) {
          costDiff = chalk.green(`${((1-costRatio)*100).toFixed(1)}% cheaper`);
        } else {
          costDiff = chalk.red(`${((costRatio-1)*100).toFixed(1)}% more`);
        }
      }

      table.push([
        result.model.replace('/', '/\n'),
        p1Status,
        p1Time,
        p1Cost,
        p2Status,
        p2Time,
        p2Cost,
        speedDiff,
        costDiff
      ]);
    });

    console.log(table.toString());
    
    // Show overall statistics
    this.showOverallStats();
  }

  private formatStatus(status: string, tokensPerSecond?: number): string {
    switch (status) {
      case 'pending':
        return chalk.gray('⏳ Pending');
      case 'running':
        const tps = tokensPerSecond ? ` (${tokensPerSecond.toFixed(1)} t/s)` : '';
        return chalk.blue(`🔄 Running${tps}`);
      case 'completed':
        return chalk.green('✅ Done');
      case 'failed':
        return chalk.red('❌ Failed');
      default:
        return chalk.gray('❓ Unknown');
    }
  }

  private showOverallStats() {
    const completedResults = Array.from(this.results.values()).filter(
      r => r.prompt1.status === 'completed' && r.prompt2.status === 'completed'
    );

    if (completedResults.length === 0) return;

    console.log(chalk.cyan.bold('\n📊 Overall Comparison Summary:\n'));

    // Average speed comparison
    const avgSpeedP1 = completedResults.reduce((sum, r) => sum + (r.prompt1.duration || 0), 0) / completedResults.length;
    const avgSpeedP2 = completedResults.reduce((sum, r) => sum + (r.prompt2.duration || 0), 0) / completedResults.length;
    
    if (avgSpeedP1 && avgSpeedP2) {
      const speedRatio = avgSpeedP1 / avgSpeedP2;
      if (speedRatio > 1) {
        console.log(`⚡ Prompt 2 is ${chalk.green(`${speedRatio.toFixed(2)}x faster`)} on average`);
      } else {
        console.log(`⚡ Prompt 1 is ${chalk.green(`${(1/speedRatio).toFixed(2)}x faster`)} on average`);
      }
    }

    // Average cost comparison
    const avgCostP1 = completedResults.reduce((sum, r) => sum + (r.prompt1.actualCost || 0), 0) / completedResults.length;
    const avgCostP2 = completedResults.reduce((sum, r) => sum + (r.prompt2.actualCost || 0), 0) / completedResults.length;
    
    if (avgCostP1 && avgCostP2) {
      const costRatio = avgCostP1 / avgCostP2;
      if (costRatio < 1) {
        console.log(`💰 Prompt 1 is ${chalk.green(`${((1-costRatio)*100).toFixed(1)}% cheaper`)} on average`);
      } else {
        console.log(`💰 Prompt 2 is ${chalk.green(`${((1-costRatio)*100).toFixed(1)}% cheaper`)} on average`);
      }
    }

    // Token efficiency
    const avgTokensP1 = completedResults.reduce((sum, r) => sum + (r.prompt1.totalTokens || 0), 0) / completedResults.length;
    const avgTokensP2 = completedResults.reduce((sum, r) => sum + (r.prompt2.totalTokens || 0), 0) / completedResults.length;
    
    if (avgTokensP1 && avgTokensP2) {
      const tokenRatio = avgTokensP1 / avgTokensP2;
      if (tokenRatio < 1) {
        console.log(`🎯 Prompt 1 uses ${chalk.green(`${((1-tokenRatio)*100).toFixed(1)}% fewer tokens`)} on average`);
      } else {
        console.log(`🎯 Prompt 2 uses ${chalk.green(`${((1-tokenRatio)*100).toFixed(1)}% fewer tokens`)} on average`);
      }
    }

    console.log();
  }

  showCompletedResponses() {
    console.log(chalk.cyan.bold('\n📝 Response Comparison:\n'));
    
    Array.from(this.results.values()).forEach(result => {
      if (result.prompt1.status === 'completed' && result.prompt2.status === 'completed') {
        console.log(chalk.yellow.bold(`\n${result.model}:`));
        console.log(chalk.blue('\nPrompt 1 Response:'));
        console.log(result.prompt1.response || 'No response');
        console.log(chalk.green('\nPrompt 2 Response:'));
        console.log(result.prompt2.response || 'No response');
        console.log(chalk.gray('\n' + '─'.repeat(80)));
      }
    });
  }

  showFinalSummary() {
    const totalResults = this.results.size;
    const completedResults = Array.from(this.results.values()).filter(
      r => r.prompt1.status === 'completed' && r.prompt2.status === 'completed'
    );
    
    console.log(chalk.cyan.bold('\n🎯 Final Comparison Summary\n'));
    console.log(`Models tested: ${totalResults}`);
    console.log(`Successfully compared: ${completedResults.length}`);
    console.log(`Success rate: ${((completedResults.length / totalResults) * 100).toFixed(1)}%`);
    
    if (completedResults.length > 0) {
      const totalTimeP1 = completedResults.reduce((sum, r) => sum + (r.prompt1.duration || 0), 0);
      const totalTimeP2 = completedResults.reduce((sum, r) => sum + (r.prompt2.duration || 0), 0);
      const totalCostP1 = completedResults.reduce((sum, r) => sum + (r.prompt1.actualCost || 0), 0);
      const totalCostP2 = completedResults.reduce((sum, r) => sum + (r.prompt2.actualCost || 0), 0);
      
      console.log(`\nTotal time - Prompt 1: ${totalTimeP1}ms, Prompt 2: ${totalTimeP2}ms`);
      console.log(`Total cost - Prompt 1: $${totalCostP1.toFixed(6)}, Prompt 2: $${totalCostP2.toFixed(6)}`);
    }
    
    console.log();
  }
}