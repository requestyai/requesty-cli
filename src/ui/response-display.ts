import chalk from 'chalk';
import { ModelResult } from '../core/types';

export class ResponseDisplay {
  
  showCompletedResponses(results: Map<string, ModelResult>): void {
    console.log(chalk.blue('📝 All Responses:'));
    console.log();

    Array.from(results.values()).forEach(result => {
      if (result.status === 'completed' && result.response) {
        console.log(chalk.blue(`▶ ${result.model}:`));
        console.log(chalk.dim('─'.repeat(60)));
        console.log(result.response);
        console.log(chalk.dim('─'.repeat(60)));
        console.log();
      }
    });
  }
}