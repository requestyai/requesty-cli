import chalk from 'chalk';
import { ModelResult } from '../core/types';

export class SummaryDisplay {
  
  showFinalSummary(results: Map<string, ModelResult>, isStreaming: boolean): void {
    const completed = Array.from(results.values()).filter(r => r.status === 'completed');
    const failed = Array.from(results.values()).filter(r => r.status === 'failed');
    const total = results.size;

    console.log(chalk.green('🎯 Final Summary:'));
    console.log(`${chalk.green('✅ Successful:')} ${completed.length}/${total}`);
    console.log(`${chalk.red('❌ Failed:')} ${failed.length}/${total}`);
    
    if (completed.length > 0) {
      this.showTimingAnalysis(completed);
      
      if (isStreaming) {
        this.showSpeedAnalysis(completed);
      } else {
        this.showTokenAnalysis(completed);
      }
    }
    console.log();
  }

  private showTimingAnalysis(completed: ModelResult[]): void {
    const durations = completed.map(r => r.duration || 0);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const medianDuration = durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)];
    
    console.log();
    console.log(chalk.cyan('⏱️  Timing Analysis:'));
    console.log(`${chalk.cyan('   Average:')} ${avgDuration.toFixed(0)}ms`);
    console.log(`${chalk.green('   Fastest:')} ${minDuration.toFixed(0)}ms`);
    console.log(`${chalk.yellow('   Slowest:')} ${maxDuration.toFixed(0)}ms`);
    console.log(`${chalk.blue('   Median:')} ${medianDuration.toFixed(0)}ms`);
    
    // Find fastest and slowest models
    const fastestModel = completed.find(r => r.duration === minDuration);
    const slowestModel = completed.find(r => r.duration === maxDuration);
    
    if (fastestModel) {
      console.log(`${chalk.green('   🏆 Fastest Model:')} ${fastestModel.model}`);
    }
    if (slowestModel && slowestModel !== fastestModel) {
      console.log(`${chalk.yellow('   🐌 Slowest Model:')} ${slowestModel.model}`);
    }
    
    console.log();
  }

  private showSpeedAnalysis(completed: ModelResult[]): void {
    const avgSpeed = completed.reduce((sum, r) => sum + (r.tokensPerSecond || 0), 0) / completed.length;
    console.log(`${chalk.cyan('🚀 Average Speed:')} ${avgSpeed.toFixed(0)} tokens/sec`);
  }

  private showTokenAnalysis(completed: ModelResult[]): void {
    const totalInputTokens = completed.reduce((sum, r) => sum + (r.inputTokens || 0), 0);
    const totalOutputTokens = completed.reduce((sum, r) => sum + (r.outputTokens || 0), 0);
    const totalTokens = totalInputTokens + totalOutputTokens;
    console.log(`${chalk.cyan('📊 Token Usage:')} ${totalTokens} total (${totalInputTokens} input + ${totalOutputTokens} output)`);
  }
}