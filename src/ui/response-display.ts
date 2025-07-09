import chalk from 'chalk';
import { ModelResult } from '../core/types';

export class ResponseDisplay {
  
  showCompletedResponses(results: Map<string, ModelResult>): void {
    console.log(chalk.blue('📝 All Responses:'));
    console.log();

    Array.from(results.values()).forEach(result => {
      if (result.status === 'completed' && result.response) {
        console.log(chalk.blue.bold(`${result.model}:`));
        console.log(result.response);
        console.log();
      }
    });
  }

  showRawResponseDebug(results: Map<string, ModelResult>): void {
    console.log(chalk.yellow('🔍 Raw Response Debug:'));
    console.log();

    Array.from(results.values()).forEach(result => {
      console.log(chalk.yellow.bold(`${result.model}:`));
      console.log(chalk.gray(`  Status: ${result.status || 'unknown'}`));
      console.log(chalk.gray(`  Success: ${result.success || false}`));
      console.log(chalk.gray(`  Duration: ${result.duration || 'unknown'}ms`));
      
      if (result.error) {
        console.log(chalk.red(`  Error: ${result.error}`));
      }
      
      if (result.response !== undefined) {
        console.log(chalk.gray(`  Response Type: ${typeof result.response}`));
        console.log(chalk.gray(`  Response Length: ${typeof result.response === 'string' ? result.response.length : 'N/A'}`));
        console.log(chalk.blue(`  Raw Response:`));
        console.log(chalk.cyan(JSON.stringify(result.response, null, 2)));
      } else {
        console.log(chalk.red(`  Response: undefined`));
      }
      
      console.log();
    });
  }
}