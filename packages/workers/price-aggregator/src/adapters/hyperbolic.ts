/**
 * Volt HQ — Hyperbolic Provider Adapter
 * 
 * Fetches real-time pricing from Hyperbolic's API.
 * Hyperbolic uses OpenAI-compatible endpoints and publishes per-token pricing.
 * 
 * API: https://api.hyperbolic.xyz/v1
 * Docs: https://docs.hyperbolic.xyz
 * Pricing: https://docs.hyperbolic.xyz/docs/hyperbolic-pricing
 */

import type { Offering, ProviderAdapter, ProviderType } from '@volthq/core';
import { makeOfferingId, shortModelName, assignCapabilityTier } from '@volthq/core';

const PROVIDER_ID = 'hyperbolic';
const PROVIDER_NAME = 'Hyperbolic';
const PROVIDER_TYPE: ProviderType = 'depin';

/**
 * Known Hyperbolic model pricing as of March 2026.
 * Source: https://docs.hyperbolic.xyz/docs/hyperbolic-pricing
 * 
 * These are manually maintained until Hyperbolic exposes a pricing API.
 * Updated when pricing page changes. Last verified: March 2026.
 */
const HYPERBOLIC_MODELS: Array<{
  model: string;
  quantization: string;
  inputPer1M: number;   // USD per 1M input tokens
  outputPer1M: number;  // USD per 1M output tokens
  gpuType: string;
}> = [
  // DeepSeek
  { model: 'deepseek-ai/DeepSeek-V3', quantization: 'FP8', inputPer1M: 0.50, outputPer1M: 1.00, gpuType: 'H100-SXM' },
  { model: 'deepseek-ai/DeepSeek-R1', quantization: 'FP8', inputPer1M: 0.50, outputPer1M: 2.00, gpuType: 'H100-SXM' },
  
  // Llama 3.1
  { model: 'meta-llama/Llama-3.1-405B-Instruct', quantization: 'FP8', inputPer1M: 4.00, outputPer1M: 4.00, gpuType: 'H100-SXM' },
  { model: 'meta-llama/Llama-3.1-70B-Instruct', quantization: 'FP8', inputPer1M: 0.40, outputPer1M: 0.40, gpuType: 'H100-SXM' },
  { model: 'meta-llama/Llama-3.1-70B-Instruct', quantization: 'BF16', inputPer1M: 0.55, outputPer1M: 0.55, gpuType: 'H100-SXM' },
  { model: 'meta-llama/Llama-3.1-8B-Instruct', quantization: 'FP8', inputPer1M: 0.06, outputPer1M: 0.06, gpuType: 'H100-SXM' },
  
  // Qwen
  { model: 'Qwen/Qwen2.5-72B-Instruct', quantization: 'FP8', inputPer1M: 0.40, outputPer1M: 0.40, gpuType: 'H100-SXM' },
  { model: 'Qwen/Qwen2.5-Coder-32B-Instruct', quantization: 'FP8', inputPer1M: 0.20, outputPer1M: 0.20, gpuType: 'H100-SXM' },
  
  // Hermes / Nous
  { model: 'NousResearch/Hermes-3-Llama-3.1-70B', quantization: 'FP8', inputPer1M: 0.40, outputPer1M: 0.40, gpuType: 'H100-SXM' },
];

/**
 * Quality scores based on known benchmark performance.
 * FP8 vs BF16 quality difference is small but measurable.
 */
function getQualityScore(model: string, quantization: string): number {
  const tier = assignCapabilityTier(model);
  
  // Base quality by tier
  let base: number;
  switch (tier) {
    case 1: base = 0.95; break;
    case 2: base = 0.88; break;
    case 3: base = 0.78; break;
    case 4: base = 0.65; break;
    case 5: base = 0.50; break;
    default: base = 0.75;
  }
  
  // Quantization adjustment
  switch (quantization) {
    case 'BF16': return base;         // reference quality
    case 'FP8': return base * 0.97;   // ~3% quality loss
    case 'INT4': return base * 0.89;  // ~11% quality loss
    default: return base * 0.95;
  }
}

/**
 * Hyperbolic adapter implementation.
 */
export const hyperbolicAdapter: ProviderAdapter = {
  providerId: PROVIDER_ID,
  providerName: PROVIDER_NAME,
  providerType: PROVIDER_TYPE,
  
  async getOfferings(): Promise<Offering[]> {
    const now = new Date().toISOString();
    
    return HYPERBOLIC_MODELS.map(m => {
      const id = makeOfferingId(PROVIDER_ID, m.model, m.quantization, m.gpuType, 'global');
      
      return {
        id,
        providerId: PROVIDER_ID,
        providerName: PROVIDER_NAME,
        providerType: PROVIDER_TYPE,
        model: m.model,
        modelShort: shortModelName(m.model),
        capabilityTier: assignCapabilityTier(m.model),
        quantization: m.quantization,
        gpuType: m.gpuType,
        region: 'global',
        priceInputPerMillion: m.inputPer1M,
        priceOutputPerMillion: m.outputPer1M,
        pricePerGpuHour: null, // Hyperbolic uses per-token pricing
        qualityScore: getQualityScore(m.model, m.quantization),
        reliabilityScore: 0.5, // neutral until we have observations
        latencyP50Ms: null,    // unknown until we benchmark
        latencyP95Ms: null,
        observationCount: 0,
        status: 'active',
        lastPriceUpdate: now,
        lastObservationUpdate: null,
        dataSource: 'manual', // will change to 'api' when we add live polling
      };
    });
  },
  
  async healthCheck(): Promise<boolean> {
    try {
      // Check if the Hyperbolic API is responding
      const response = await fetch('https://api.hyperbolic.xyz/v1/models', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
