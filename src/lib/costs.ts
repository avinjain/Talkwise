// Pricing per 1M tokens (as of early 2026)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4': { input: 30, output: 60 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
};

const DEFAULT_PRICING = { input: 5, output: 15 };

/**
 * Estimate the cost of an API call in USD.
 */
export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model] || DEFAULT_PRICING;
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 decimal places
}
