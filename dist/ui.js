"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalUI = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
class TerminalUI {
    constructor(darkMode = true) {
        this.darkMode = true;
        this.darkMode = darkMode;
    }
    getTheme() {
        return this.darkMode ? {
            primary: chalk_1.default.cyan,
            secondary: chalk_1.default.gray,
            success: chalk_1.default.green,
            error: chalk_1.default.red,
            warning: chalk_1.default.yellow,
            info: chalk_1.default.blue,
            dim: chalk_1.default.dim,
            bold: chalk_1.default.bold,
            underline: chalk_1.default.underline
        } : {
            primary: chalk_1.default.blue,
            secondary: chalk_1.default.black,
            success: chalk_1.default.green,
            error: chalk_1.default.red,
            warning: chalk_1.default.yellow,
            info: chalk_1.default.blue,
            dim: chalk_1.default.dim,
            bold: chalk_1.default.bold,
            underline: chalk_1.default.underline
        };
    }
    showHeader() {
        const theme = this.getTheme();
        console.log();
        console.log(theme.primary.bold('🚀 Requesty CLI'));
        console.log(theme.secondary('Test AI models via Requesty API'));
        console.log();
    }
    showModelList(models) {
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
    showPrompt(prompt) {
        const theme = this.getTheme();
        console.log(theme.warning.bold('📝 Prompt:'));
        console.log(theme.dim('─'.repeat(50)));
        console.log(prompt);
        console.log(theme.dim('─'.repeat(50)));
        console.log();
    }
    createSpinner(text) {
        return (0, ora_1.default)({
            text,
            color: 'cyan',
            spinner: 'dots'
        });
    }
    showResults(results) {
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
            }
            else if (result.error) {
                console.log(theme.error(`   Error: ${result.error}`));
            }
            console.log();
        });
    }
    showSummary(results) {
        const theme = this.getTheme();
        const successful = results.filter(r => r.success);
        const avgDuration = results.reduce((acc, r) => acc + (r.duration || 0), 0) / results.length;
        console.log(theme.bold('📊 Summary:'));
        console.log(`${theme.info('Success Rate:')} ${((successful.length / results.length) * 100).toFixed(1)}%`);
        console.log(`${theme.info('Average Duration:')} ${avgDuration.toFixed(0)}ms`);
        console.log(`${theme.info('Total Models:')} ${results.length}`);
        console.log();
    }
    showError(error) {
        const theme = this.getTheme();
        console.log(theme.error.bold('❌ Error:'));
        console.log(theme.error(error));
        console.log();
    }
    showWarning(warning) {
        const theme = this.getTheme();
        console.log(theme.warning.bold('⚠️  Warning:'));
        console.log(theme.warning(warning));
        console.log();
    }
    showInfo(info) {
        const theme = this.getTheme();
        console.log(theme.info.bold('ℹ️  Info:'));
        console.log(theme.info(info));
        console.log();
    }
}
exports.TerminalUI = TerminalUI;
//# sourceMappingURL=ui.js.map