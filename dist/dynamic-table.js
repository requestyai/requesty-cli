"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicResultsTable = void 0;
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
class DynamicResultsTable {
    constructor(models, isStreaming) {
        this.results = new Map();
        this.tableInitialized = false;
        this.modelOrder = [];
        this.isStreaming = isStreaming;
        const headers = ['Model', 'Status'];
        if (isStreaming) {
            headers.push('Duration', 'Speed', 'Tokens');
        }
        else {
            headers.push('Duration', 'Input Tokens', 'Output Tokens', 'Total Tokens');
        }
        this.table = new cli_table3_1.default({
            head: headers,
            style: { head: ['cyan'] },
            colWidths: isStreaming ? [25, 12, 12, 12, 12] : [25, 12, 12, 12, 12, 12]
        });
        models.forEach(model => {
            const modelName = model.split('/').slice(1).join('/');
            this.results.set(model, {
                model: modelName,
                status: 'pending'
            });
        });
        this.renderTable();
    }
    updateModel(modelId, update) {
        const existing = this.results.get(modelId);
        if (existing) {
            const wasCompleted = existing.status === 'completed' || existing.status === 'failed';
            const newResult = { ...existing, ...update };
            const isNowCompleted = newResult.status === 'completed' || newResult.status === 'failed';
            this.results.set(modelId, newResult);
            if (this.isStreaming || (!wasCompleted && isNowCompleted)) {
                this.renderTable();
            }
        }
    }
    renderTable() {
        if (!this.tableInitialized) {
            console.log(chalk_1.default.green('📊 Live Results:'));
            console.log();
            this.tableInitialized = true;
            this.renderFullTable();
        }
        else {
            if (this.isStreaming) {
                this.updateTableInPlace();
            }
            else {
                this.updateNonStreamingTable();
            }
        }
    }
    renderFullTable() {
        this.table.length = 0;
        this.modelOrder = [];
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
            }
            else {
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
    updateTableInPlace() {
        const tableLines = this.table.length + 4;
        process.stdout.write(`\x1b[${tableLines}A`);
        this.renderFullTable();
    }
    updateNonStreamingTable() {
        const hasCompleted = Array.from(this.results.values()).some(r => r.status === 'completed' || r.status === 'failed');
        if (hasCompleted) {
            const tableLines = this.table.length + 4;
            process.stdout.write(`\x1b[${tableLines}A`);
            this.renderFullTable();
        }
    }
    getStatusIcon(status) {
        switch (status) {
            case 'pending': return chalk_1.default.gray('⏳');
            case 'running': return chalk_1.default.yellow('🔄');
            case 'completed': return chalk_1.default.green('✅');
            case 'failed': return chalk_1.default.red('❌');
            default: return chalk_1.default.gray('•');
        }
    }
    showCompletedResponses() {
        console.log(chalk_1.default.blue('📝 All Responses:'));
        console.log();
        Array.from(this.results.values()).forEach(result => {
            if (result.status === 'completed' && result.response) {
                console.log(chalk_1.default.blue(`▶ ${result.model}:`));
                console.log(chalk_1.default.dim('─'.repeat(60)));
                console.log(result.response);
                console.log(chalk_1.default.dim('─'.repeat(60)));
                console.log();
            }
        });
    }
    showFinalSummary() {
        const completed = Array.from(this.results.values()).filter(r => r.status === 'completed');
        const failed = Array.from(this.results.values()).filter(r => r.status === 'failed');
        const total = this.results.size;
        console.log(chalk_1.default.green('🎯 Final Summary:'));
        console.log(`${chalk_1.default.green('✅ Successful:')} ${completed.length}/${total}`);
        console.log(`${chalk_1.default.red('❌ Failed:')} ${failed.length}/${total}`);
        if (completed.length > 0) {
            const avgDuration = completed.reduce((sum, r) => sum + (r.duration || 0), 0) / completed.length;
            console.log(`${chalk_1.default.cyan('⚡ Average Duration:')} ${avgDuration.toFixed(0)}ms`);
            if (this.isStreaming) {
                const avgSpeed = completed.reduce((sum, r) => sum + (r.tokensPerSecond || 0), 0) / completed.length;
                console.log(`${chalk_1.default.cyan('🚀 Average Speed:')} ${avgSpeed.toFixed(0)} tokens/sec`);
            }
            else {
                const totalInputTokens = completed.reduce((sum, r) => sum + (r.inputTokens || 0), 0);
                const totalOutputTokens = completed.reduce((sum, r) => sum + (r.outputTokens || 0), 0);
                console.log(`${chalk_1.default.cyan('📥 Total Input Tokens:')} ${totalInputTokens}`);
                console.log(`${chalk_1.default.cyan('📤 Total Output Tokens:')} ${totalOutputTokens}`);
            }
        }
        console.log();
    }
}
exports.DynamicResultsTable = DynamicResultsTable;
//# sourceMappingURL=dynamic-table.js.map