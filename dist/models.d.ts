export interface ModelProvider {
    name: string;
    displayName: string;
    color: string;
    models: string[];
}
export declare const DEFAULT_MODELS: string[];
export declare const MODEL_PROVIDERS: Record<string, ModelProvider>;
export declare function categorizeModels(models: {
    id: string;
}[]): Record<string, ModelProvider>;
export declare function getProviderFromModel(modelId: string): string;
export declare function getModelName(modelId: string): string;
//# sourceMappingURL=models.d.ts.map