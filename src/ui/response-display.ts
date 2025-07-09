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
      
      if (result.response !== undefined) {
        console.log(chalk.gray(`  Response Type: ${typeof result.response}`));
        
        if (typeof result.response === 'string') {
          console.log(chalk.gray(`  Response Length: ${result.response.length}`));
          console.log(chalk.blue(`  String Response:`));
          console.log(chalk.cyan(result.response));
        } else {
          // It's a ChatCompletionResponse object
          console.log(chalk.blue(`  Response Object Structure:`));
          console.log(chalk.gray(`    - ID: ${result.response.id || 'N/A'}`));
          console.log(chalk.gray(`    - Model: ${result.response.model || 'N/A'}`));
          console.log(chalk.gray(`    - Choices Length: ${result.response.choices?.length || 0}`));
          
          if (result.response.choices && result.response.choices.length > 0) {
            const choice = result.response.choices[0];
            console.log(chalk.gray(`    - Choice[0] Message Role: ${choice.message?.role || 'N/A'}`));
            console.log(chalk.gray(`    - Choice[0] Message Content Length: ${choice.message?.content?.length || 0}`));
            console.log(chalk.blue(`    - Choice[0] Message Content:`));
            console.log(chalk.cyan(choice.message?.content || 'NO CONTENT'));
          }
          
          if (result.response.usage) {
            console.log(chalk.gray(`    - Usage Prompt Tokens: ${result.response.usage.prompt_tokens || 'N/A'}`));
            console.log(chalk.gray(`    - Usage Completion Tokens: ${result.response.usage.completion_tokens || 'N/A'}`));
            console.log(chalk.gray(`    - Usage Total Tokens: ${result.response.usage.total_tokens || 'N/A'}`));
          } else {
            console.log(chalk.red(`    - Usage: undefined`));
          }
          
          console.log(chalk.blue(`  Full Raw Response:`));
          console.log(chalk.cyan(JSON.stringify(result.response, null, 2)));
        }
      } else {
        console.log(chalk.red(`  Response: undefined`));
      }
      
      console.log();
    });
  }
}