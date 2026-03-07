/**
 * Volt HQ — Price Normalization
 *
 * Converts heterogeneous pricing models into a standard format.
 * All prices are normalized to USD per million tokens.
 */
/**
 * Generate a deterministic offering ID from its components.
 */
export declare function makeOfferingId(providerId: string, model: string, quantization: string | null, gpuType: string | null, region: string): string;
/**
 * Extract a short model name from a full model identifier.
 * "meta-llama/Llama-3.1-70B-Instruct" → "Llama-70B"
 * "deepseek-ai/DeepSeek-V3" → "DeepSeek-V3"
 */
export declare function shortModelName(fullName: string): string;
/**
 * Convert GPU-hour pricing to per-million-token pricing.
 * Returns null if we can't estimate (unknown model/GPU combo).
 */
export declare function gpuHourToPerToken(pricePerHour: number, modelName: string, gpuType: string): {
    input: number;
    output: number;
} | null;
/**
 * Assign a capability tier based on model name.
 * Tier 1 = frontier (GPT-4o, Claude Opus, Llama 405B)
 * Tier 2 = strong (GPT-4o-mini, Claude Sonnet, Llama 70B)
 * Tier 3 = good (Llama 8B, Mistral 7B, Gemma)
 * Tier 4 = fast/cheap (Gemini Flash, Haiku)
 * Tier 5 = embedding/specialized
 */
export declare function assignCapabilityTier(modelName: string): 1 | 2 | 3 | 4 | 5;
//# sourceMappingURL=normalize.d.ts.map