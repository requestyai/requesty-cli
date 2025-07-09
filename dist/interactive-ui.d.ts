import cliProgress from 'cli-progress';
import { ModelInfo } from './types';
export declare class InteractiveUI {
    private providers;
    private selectedModels;
    constructor();
    private showWelcome;
    initializeModels(models: ModelInfo[]): Promise<void>;
    showMainMenu(): Promise<'quick' | 'select' | 'exit'>;
    selectModels(): Promise<string[]>;
    getStreamingChoice(): Promise<boolean>;
    getPrompt(): Promise<string>;
    showSelectedModels(models: string[]): void;
    createStreamingProgress(modelName: string): {
        progress: cliProgress.SingleBar;
        updateProgress: (content: string, stats: {
            tokensPerSecond: number;
            totalTokens: number;
        }) => void;
        finish: (success: boolean, error?: string) => void;
    };
    showStreamingResponse(modelName: string, response: string): void;
    showSummary(results: Array<{
        model: string;
        success: boolean;
        duration: number;
        tokensPerSecond: number;
        totalTokens: number;
        error?: string;
    }>): void;
    askContinue(): Promise<boolean>;
    showError(error: string): void;
    showGoodbye(): void;
}
//# sourceMappingURL=interactive-ui.d.ts.map