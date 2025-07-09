import chalk from 'chalk';
import { ModelResult } from '../core/types';

export class ResponseDisplay {
  
  showCompletedResponses(results: Map<string, ModelResult>): void {
    console.log(chalk.blue('📝 All Responses:'));
    console.log();

    Array.from(results.values()).forEach(result => {
      if (result.status === 'completed' && result.response) {
        console.log(chalk.blue.bold(`${result.model}:`));
        
        // Handle both string responses and ChatCompletionResponse objects
        if (typeof result.response === 'string') {
          console.log(result.response);
        } else if (result.response && typeof result.response === 'object' && result.response.choices) {
          // Extract content from ChatCompletionResponse
          const content = result.response.choices[0]?.message?.content || 'No response content';
          console.log(content);
        } else {
          console.log(chalk.red('Unable to extract response content'));
        }
        
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
      
      // Show the TRUE RAW API response
      if (result.rawResponse !== undefined) {
        console.log(chalk.magenta.bold('  🔥 TRUE RAW API RESPONSE (JSON):'));
        console.log(chalk.cyan(JSON.stringify(result.rawResponse, null, 2)));
      } else {
        console.log(chalk.red(`  Raw Response: undefined`));
      }
      
      // Show processed response for comparison
      if (result.response !== undefined) {
        console.log(chalk.blue('  📝 Processed Response:'));
        
        if (typeof result.response === 'string') {
          console.log(chalk.gray(`    Type: string (length: ${result.response.length})`));
          console.log(chalk.cyan(`    Content: ${result.response.substring(0, 200)}${result.response.length > 200 ? '...' : ''}`));
        } else {
          // It's a ChatCompletionResponse object
          console.log(chalk.gray(`    Type: object`));
          console.log(chalk.gray(`    ID: ${result.response.id || 'N/A'}`));
          console.log(chalk.gray(`    Model: ${result.response.model || 'N/A'}`));
          console.log(chalk.gray(`    Choices Length: ${result.response.choices?.length || 0}`));
          
          if (result.response.choices && result.response.choices.length > 0) {
            const choice = result.response.choices[0];
            const content = choice.message?.content || '';
            console.log(chalk.gray(`    Content Length: ${content.length}`));
            console.log(chalk.cyan(`    Content: ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`));
          }
          
          if (result.response.usage) {
            console.log(chalk.gray(`    Usage: ${result.response.usage.prompt_tokens}+${result.response.usage.completion_tokens}=${result.response.usage.total_tokens} tokens`));
          } else {
            console.log(chalk.red(`    Usage: undefined`));
          }
        }
      } else {
        console.log(chalk.red(`  Processed Response: undefined`));
      }
      
      console.log(chalk.gray('─'.repeat(80)));
      console.log();
    });
  }
}