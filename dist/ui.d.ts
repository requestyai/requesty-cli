import ora from 'ora';
import { ModelResult, ModelInfo } from './types';
export declare class TerminalUI {
    private darkMode;
    constructor(darkMode?: boolean);
    private getTheme;
    showHeader(): void;
    showModelList(models: ModelInfo[]): void;
    showPrompt(prompt: string): void;
    createSpinner(text: string): ora.Ora;
    showResults(results: ModelResult[]): void;
    showSummary(results: ModelResult[]): void;
    showError(error: string): void;
    showWarning(warning: string): void;
    showInfo(info: string): void;
}
//# sourceMappingURL=ui.d.ts.map