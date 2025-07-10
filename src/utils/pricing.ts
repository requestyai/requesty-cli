import { ModelInfo } from '../core/types';

export interface PricingInfo {
  actualCost: number; // Actual cost in dollars
  blendedCostPerMillion: number; // Blended cost per million tokens
}

export class PricingCalculator {
  /**
   * Calculate pricing for a model result
   * @param modelInfo - Model information with pricing
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @param reasoningTokens - Number of reasoning tokens (treated as input tokens)
   * @returns PricingInfo with actual cost and blended cost per million
   */
  static calculatePricing(
    modelInfo: ModelInfo,
    inputTokens: number,
    outputTokens: number,
    reasoningTokens: number = 0
  ): PricingInfo {
    // Default to 0 if no pricing info available
    const inputPrice = modelInfo.input_price || 0;
    const outputPrice = modelInfo.output_price || 0;

    // If we have no pricing data, return zeros
    if (inputPrice === 0 && outputPrice === 0) {
      return { actualCost: 0, blendedCostPerMillion: 0 };
    }

    // Prices from API are already per-token
    // Based on your example: input_price: 8e-7 means $0.0000008 per token
    const inputPricePerToken = inputPrice;
    const outputPricePerToken = outputPrice;

    // Reasoning tokens are treated as input tokens for pricing
    const totalInputTokens = inputTokens + reasoningTokens;

    // Calculate actual cost in dollars
    const inputCost = totalInputTokens * inputPricePerToken;
    const outputCost = outputTokens * outputPricePerToken;
    const actualCost = inputCost + outputCost;

    // Calculate blended cost per million tokens
    const totalTokens = inputTokens + outputTokens + reasoningTokens;
    const blendedCostPerMillion =
      totalTokens > 0 ? (actualCost / totalTokens) * 1_000_000 : 0;

    return {
      actualCost,
      blendedCostPerMillion,
    };
  }

  /**
   * Format actual cost for display - always shows real dollars
   * @param cost - Cost in dollars
   * @returns Formatted cost string with up to 5 decimals
   */
  static formatActualCost(cost: number): string {
    if (cost === 0) {
      return '$0.00000';
    }
    if (cost < 0.00001) {
      return `$${cost.toFixed(8)}`;
    } // Show more decimals for very small costs
    if (cost < 0.001) {
      return `$${cost.toFixed(6)}`;
    }
    if (cost < 0.1) {
      return `$${cost.toFixed(5)}`;
    }
    return `$${cost.toFixed(4)}`;
  }

  /**
   * Format cost per million tokens for display
   * @param costPerMillion - Cost per million tokens
   * @returns Formatted cost string
   */
  static formatCostPerMillion(costPerMillion: number): string {
    if (costPerMillion === 0) {
      return '$0.00/M';
    }
    if (costPerMillion < 1) {
      return `$${costPerMillion.toFixed(3)}/M`;
    }
    return `$${costPerMillion.toFixed(2)}/M`;
  }
}
