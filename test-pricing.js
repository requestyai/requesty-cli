// Quick test of pricing calculation
const { PricingCalculator } = require('./dist/utils/pricing');

// Test with your DeepSeek-R1 example
const mockModel = {
  id: "nebius/deepseek-ai/DeepSeek-R1",
  input_price: 8e-7,  // $0.0000008 per token
  output_price: 0.0000024  // $0.0000024 per token
};

const inputTokens = 13;
const outputTokens = 78;
const reasoningTokens = 0;

console.log('🧪 Testing pricing calculation...');
console.log('Model:', mockModel);
console.log('Tokens:', { inputTokens, outputTokens, reasoningTokens });

const result = PricingCalculator.calculatePricing(
  mockModel,
  inputTokens,
  outputTokens,
  reasoningTokens
);

console.log('Result:', result);
console.log('Formatted actual cost:', PricingCalculator.formatActualCost(result.actualCost));
console.log('Formatted blended cost:', PricingCalculator.formatCostPerMillion(result.blendedCostPerMillion));