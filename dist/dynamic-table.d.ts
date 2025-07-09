export interface ModelResult {
    model: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    duration?: number;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    tokensPerSecond?: number;
    error?: string;
    response?: string;
}
export declare class DynamicResultsTable {
    private table;
    private results;
    private isStreaming;
    constructor(models: string[], isStreaming: boolean);
    updateModel(modelId: string, update: Partial<ModelResult>): void;
    private tableInitialized;
    private modelOrder;
    private renderTable;
    private renderFullTable;
    private updateTableInPlace;
    private updateNonStreamingTable;
    private getStatusIcon;
    showCompletedResponses(): void;
    showFinalSummary(): void;
}
//# sourceMappingURL=dynamic-table.d.ts.map