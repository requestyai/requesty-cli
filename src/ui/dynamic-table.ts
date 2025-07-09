import { ModelResult } from '../core/types';
import { TableRenderer } from './table-renderer';
import { ResponseDisplay } from './response-display';
import { SummaryDisplay } from './summary-display';

export class DynamicResultsTable {
  private results: Map<string, ModelResult> = new Map();
  private tableRenderer: TableRenderer;
  private responseDisplay: ResponseDisplay;
  private summaryDisplay: SummaryDisplay;
  private isStreaming: boolean;

  constructor(models: string[], isStreaming: boolean) {
    this.isStreaming = isStreaming;
    this.tableRenderer = new TableRenderer(models, isStreaming);
    this.responseDisplay = new ResponseDisplay();
    this.summaryDisplay = new SummaryDisplay();

    // Initialize all models as pending
    models.forEach(model => {
      const modelName = model.split('/').slice(1).join('/');
      this.results.set(model, {
        model: modelName,
        status: 'pending'
      });
    });

    this.renderTable();
  }

  updateModel(modelId: string, update: Partial<ModelResult>) {
    const existing = this.results.get(modelId);
    if (existing) {
      const wasCompleted = existing.status === 'completed' || existing.status === 'failed';
      const newResult = { ...existing, ...update };
      const isNowCompleted = newResult.status === 'completed' || newResult.status === 'failed';
      
      this.results.set(modelId, newResult);
      
      // Only update table if streaming or if status meaningfully changed
      if (this.isStreaming || (!wasCompleted && isNowCompleted)) {
        this.renderTable();
      }
    }
  }

  private renderTable() {
    this.tableRenderer.renderTable(this.results);
  }

  showCompletedResponses() {
    this.responseDisplay.showCompletedResponses(this.results);
  }

  showFinalSummary() {
    this.summaryDisplay.showFinalSummary(this.results, this.isStreaming);
  }
}