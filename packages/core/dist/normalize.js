/**
 * Volt HQ — Price Normalization
 *
 * Converts heterogeneous pricing models into a standard format.
 * All prices are normalized to USD per million tokens.
 */
/**
 * Generate a deterministic offering ID from its components.
 */
export function makeOfferingId(providerId, model, quantization, gpuType, region) {
    const parts = [
        providerId,
        model,
        quantization || 'default',
        gpuType || 'unknown',
        region,
    ];
    return parts.join(':');
}
/**
 * Extract a short model name from a full model identifier.
 * "meta-llama/Llama-3.1-70B-Instruct" → "Llama-70B"
 * "deepseek-ai/DeepSeek-V3" → "DeepSeek-V3"
 */
export function shortModelName(fullName) {
    // Remove org prefix
    const parts = fullName.split('/');
    let name = parts[parts.length - 1] ?? fullName;
    // Common simplifications
    name = name.replace(/Meta-Llama-/i, 'Llama-');
    name = name.replace(/Llama-3\.1-/i, 'Llama-');
    name = name.replace(/Llama-3-/i, 'Llama-');
    name = name.replace(/-Instruct$/i, '');
    name = name.replace(/-Chat$/i, '');
    name = name.replace(/-Turbo$/i, '-Turbo');
    // Compress parameter counts: 70B-Instruct → 70B
    name = name.replace(/(\d+)B-\w+$/, '$1B');
    return name;
}
/**
 * Estimate tokens per GPU-hour for a given model on a given GPU.
 * Used to convert per-GPU-hour pricing to per-token pricing.
 *
 * These are approximate benchmarks. Real data from observations
 * will replace these over time.
 */
const TOKENS_PER_GPU_HOUR = {
    // model pattern → gpu → tokens/hour (output tokens)
    '70b': {
        'H100-SXM': 180_000, // ~50 tok/s
        'H100-PCIe': 140_000, // ~39 tok/s
        'A100-80GB': 90_000, // ~25 tok/s
    },
    '8b': {
        'H100-SXM': 1_800_000, // ~500 tok/s
        'H100-PCIe': 1_400_000,
        'A100-80GB': 900_000,
    },
    '405b': {
        'H100-SXM': 36_000, // ~10 tok/s (needs multi-GPU)
        'A100-80GB': 18_000,
    },
};
/**
 * Convert GPU-hour pricing to per-million-token pricing.
 * Returns null if we can't estimate (unknown model/GPU combo).
 */
export function gpuHourToPerToken(pricePerHour, modelName, gpuType) {
    // Find matching model size
    const modelLower = modelName.toLowerCase();
    let tokensPerHour = null;
    for (const [pattern, gpuMap] of Object.entries(TOKENS_PER_GPU_HOUR)) {
        if (modelLower.includes(pattern)) {
            tokensPerHour = gpuMap[gpuType] || null;
            break;
        }
    }
    if (!tokensPerHour)
        return null;
    // Price per token = price per hour / tokens per hour
    // Price per million = price per token * 1,000,000
    const pricePerToken = pricePerHour / tokensPerHour;
    const pricePerMillion = pricePerToken * 1_000_000;
    // Input is typically ~same speed as output for prefill-dominated workloads
    // Rough approximation: input is 2-3x faster than output, so ~40% the cost
    return {
        input: Math.round(pricePerMillion * 0.4 * 1000) / 1000,
        output: Math.round(pricePerMillion * 1000) / 1000,
    };
}
/**
 * Assign a capability tier based on model name.
 * Tier 1 = frontier (GPT-4o, Claude Opus, Llama 405B)
 * Tier 2 = strong (GPT-4o-mini, Claude Sonnet, Llama 70B)
 * Tier 3 = good (Llama 8B, Mistral 7B, Gemma)
 * Tier 4 = fast/cheap (Gemini Flash, Haiku)
 * Tier 5 = embedding/specialized
 */
export function assignCapabilityTier(modelName) {
    const m = modelName.toLowerCase();
    // Tier 1: Frontier
    if (m.includes('gpt-4o') && !m.includes('mini'))
        return 1;
    if (m.includes('claude-3-opus') || m.includes('claude-opus'))
        return 1;
    if (m.includes('405b'))
        return 1;
    if (m.includes('deepseek-v3'))
        return 1;
    if (m.includes('deepseek-r1') && !m.includes('distill'))
        return 1;
    // Tier 2: Strong
    if (m.includes('gpt-4o-mini'))
        return 2;
    if (m.includes('claude-3-sonnet') || m.includes('claude-sonnet'))
        return 2;
    if (m.includes('70b'))
        return 2;
    if (m.includes('qwen2.5-72b'))
        return 2;
    if (m.includes('mixtral'))
        return 2;
    // Tier 3: Good
    if (m.includes('8b') || m.includes('7b'))
        return 3;
    if (m.includes('gemma'))
        return 3;
    if (m.includes('phi-'))
        return 3;
    // Tier 4: Fast/cheap
    if (m.includes('flash') || m.includes('haiku') || m.includes('mini'))
        return 4;
    if (m.includes('3b') || m.includes('1b'))
        return 4;
    // Tier 5: Specialized
    if (m.includes('embed') || m.includes('whisper'))
        return 5;
    // Default to Tier 3 for unknown models
    return 3;
}
//# sourceMappingURL=normalize.js.map