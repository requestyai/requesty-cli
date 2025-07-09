import chalk from 'chalk';
import ora from 'ora';
import { ModelResult, ModelInfo } from '../core/types';

export class TerminalUI {
  private darkMode: boolean = true;

  constructor(darkMode: boolean = true) {
    this.darkMode = darkMode;
  }

  private getTheme() {
    return this.darkMode ? {
      primary: chalk.cyan,
      secondary: chalk.gray,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      info: chalk.blue,
      dim: chalk.dim,
      bold: chalk.bold,
      underline: chalk.underline
    } : {
      primary: chalk.blue,
      secondary: chalk.black,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      info: chalk.blue,
      dim: chalk.dim,
      bold: chalk.bold,
      underline: chalk.underline
    };
  }

  showHeader() {
    const theme = this.getTheme();
    console.log();
    console.log(theme.primary.bold('🚀 Requesty CLI'));
    console.log(theme.secondary('Test AI models via Requesty API'));
    console.log();
  }

  showModelList(models: ModelInfo[]) {
    const theme = this.getTheme();
    console.log(theme.info.bold(`📋 Available Models (${models.length}):`));
    console.log();
    
    models.forEach((model, index) => {
      const number = theme.dim(`${(index + 1).toString().padStart(2, '0')}.`);
      const name = theme.primary(model.id);
      const owner = theme.secondary(`(${model.owned_by})`);
      console.log(`${number} ${name} ${owner}`);
    });
    console.log();
  }

  showPrompt(prompt: string) {
    const theme = this.getTheme();
    console.log(theme.warning.bold('📝 Prompt:'));
    console.log(theme.dim('─'.repeat(50)));
    console.log(prompt);
    console.log(theme.dim('─'.repeat(50)));
    console.log();
  }

  createSpinner(text: string) {
    return ora({
      text,
      color: 'cyan',
      spinner: 'dots'
    });
  }

  showResults(results: ModelResult[]) {
    const theme = this.getTheme();
    console.log(theme.success.bold('🎯 Results:'));
    console.log();

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(theme.info(`✅ Successful: ${successful.length}`));
    console.log(theme.error(`❌ Failed: ${failed.length}`));
    console.log();

    results.forEach((result, index) => {
      const number = theme.dim(`${(index + 1).toString().padStart(2, '0')}.`);
      const status = result.success ? theme.success('✅') : theme.error('❌');
      const model = theme.primary(result.model);
      const duration = theme.dim(`(${result.duration}ms)`);
      
      console.log(`${number} ${status} ${model} ${duration}`);
      
      if (result.success && result.response) {
        const content = result.response.choices[0]?.message?.content || 'No response';
        const truncated = content.length > 100 ? content.substring(0, 100) + '...' : content;
        console.log(theme.dim(`   ${truncated.replace(/\n/g, ' ')}`));
        
        if (result.response.usage) {
          const tokens = theme.dim(`   Tokens: ${result.response.usage.total_tokens} (${result.response.usage.prompt_tokens}+${result.response.usage.completion_tokens})`);
          console.log(tokens);
        }
      } else if (result.error) {
        console.log(theme.error(`   Error: ${result.error}`));
      }
      console.log();
    });
  }

  showSummary(results: ModelResult[]) {
    const theme = this.getTheme();
    const successful = results.filter(r => r.success);
    const avgDuration = results.reduce((acc, r) => acc + (r.duration || 0), 0) / results.length;
    
    console.log(theme.bold('📊 Summary:'));
    console.log(`${theme.info('Success Rate:')} ${((successful.length / results.length) * 100).toFixed(1)}%`);
    console.log(`${theme.info('Average Duration:')} ${avgDuration.toFixed(0)}ms`);
    console.log(`${theme.info('Total Models:')} ${results.length}`);
    console.log();
  }

  showError(error: string) {
    const theme = this.getTheme();
    console.log(theme.error.bold('❌ Error:'));
    console.log(theme.error(error));
    console.log();
  }

  showWarning(warning: string) {
    const theme = this.getTheme();
    console.log(theme.warning.bold('⚠️  Warning:'));
    console.log(theme.warning(warning));
    console.log();
  }

  showInfo(info: string) {
    const theme = this.getTheme();
    console.log(theme.info.bold('ℹ️  Info:'));
    console.log(theme.info(info));
    console.log();
  }
}