/**
 * Volt HQ — Hyperbolic Provider Adapter
 *
 * Attempts to fetch the model list from Hyperbolic's API and match
 * against a known pricing map. Falls back to static pricing if the API
 * is unreachable (requires auth).
 *
 * API: https://api.hyperbolic.xyz/v1/models (requires API key)
 * Pricing: https://docs.hyperbolic.xyz/docs/hyperbolic-pricing
 */

import type { Offering, ProviderAdapter, ProviderType } from '@volthq/core';
import { makeOfferingId, shortModelName, assignCapabilityTier } from '@volthq/core';

const PROVIDER_ID = 'hyperbolic';
const PROVIDER_NAME = 'Hyperbolic';
const PROVIDER_TYPE: ProviderType = 'depin';

const API_URL = 'https://api.hyperbolic.xyz/v1/models';

/**
 * Known Hyperbolic pricing map. Pricing is per-million tokens.
 * Source: https://docs.hyperbolic.xyz/docs/hyperbolic-pricing
 * Last verified: March 2026.
 *
 * Key format: `model:quantization` for models with multiple quant variants.
 */
const PRICING_MAP: Record<string, {
  inputPer1M: number;
  outputPer1M: number;
  quantization: string;
  gpuType: string;
}> = {
  'deepseek-ai/DeepSeek-V3:FP8': { inputPer1M: 0.50, outputPer1M: 1.00, quantization: 'FP8', gpuType: 'H100-SXM' },
  'deepseek-ai/DeepSeek-R1:FP8': { inputPer1M: 0.50, outputPer1M: 2.00, quantization: 'FP8', gpuType: 'H100-SXM' },
  'meta-llama/Llama-3.1-405B-Instruct:FP8': { inputPer1M: 4.00, outputPer1M: 4.00, quantization: 'FP8', gpuType: 'H100-SXM' },
  'meta-llama/Llama-3.1-70B-Instruct:FP8': { inputPer1M: 0.40, outputPer1M: 0.40, quantization: 'FP8', gpuType: 'H100-SXM' },
  'meta-llama/Llama-3.1-70B-Instruct:BF16': { inputPer1M: 0.55, outputPer1M: 0.55, quantization: 'BF16', gpuType: 'H100-SXM' },
  'meta-llama/Llama-3.1-8B-Instruct:FP8': { inputPer1M: 0.06, outputPer1M: 0.06, quantization: 'FP8', gpuType: 'H100-SXM' },
  'Qwen/Qwen2.5-72B-Instruct:FP8': { inputPer1M: 0.40, outputPer1M: 0.40, quantization: 'FP8', gpuType: 'H100-SXM' },
  'Qwen/Qwen2.5-Coder-32B-Instruct:FP8': { inputPer1M: 0.20, outputPer1M: 0.20, quantization: 'FP8', gpuType: 'H100-SXM' },
  'NousResearch/Hermes-3-Llama-3.1-70B:FP8': { inputPer1M: 0.40, outputPer1M: 0.40, quantization: 'FP8', gpuType: 'H100-SXM' },
};

/** Static fallback — used when live API is unreachable. */
const FALLBACK_MODELS: Array<{
  model: string;
  quantization: string;
  inputPer1M: number;
  outputPer1M: number;
  gpuType: string;
}> = [
  { model: 'deepseek-ai/DeepSeek-V3', quantization: 'FP8', inputPer1M: 0.50, outputPer1M: 1.00, gpuType: 'H100-SXM' },
  { model: 'deepseek-ai/DeepSeek-R1', quantization: 'FP8', inputPer1M: 0.50, outputPer1M: 2.00, gpuType: 'H100-SXM' },
  { model: 'meta-llama/Llama-3.1-405B-Instruct', quantization: 'FP8', inputPer1M: 4.00, outputPer1M: 4.00, gpuType: 'H100-SXM' },
  { model: 'meta-llama/Llama-3.1-70B-Instruct', quantization: 'FP8', inputPer1M: 0.40, outputPer1M: 0.40, gpuType: 'H100-SXM' },
  { model: 'meta-llama/Llama-3.1-70B-Instruct', quantization: 'BF16', inputPer1M: 0.55, outputPer1M: 0.55, gpuType: 'H100-SXM' },
  { model: 'meta-llama/Llama-3.1-8B-Instruct', quantization: 'FP8', inputPer1M: 0.06, outputPer1M: 0.06, gpuType: 'H100-SXM' },
  { model: 'Qwen/Qwen2.5-72B-Instruct', quantization: 'FP8', inputPer1M: 0.40, outputPer1M: 0.40, gpuType: 'H100-SXM' },
  { model: 'Qwen/Qwen2.5-Coder-32B-Instruct', quantization: 'FP8', inputPer1M: 0.20, outputPer1M: 0.20, gpuType: 'H100-SXM' },
  { model: 'NousResearch/Hermes-3-Llama-3.1-70B', quantization: 'FP8', inputPer1M: 0.40, outputPer1M: 0.40, gpuType: 'H100-SXM' },
];

/** Model ID patterns to exclude (embeddings, audio, image). */
const EXCLUDED_PATTERNS = [
  'embed', 'whisper', 'tts', 'speech', 'image',
  'stable-diffusion', 'sdxl', 'flux',
];

function getQualityScore(model: string, quantization: string): number {
  const tier = assignCapabilityTier(model);
  let base: number;
  switch (tier) {
    case 1: base = 0.95; break;
    case 2: base = 0.88; break;
    case 3: base = 0.78; break;
    case 4: base = 0.65; break;
    case 5: base = 0.50; break;
    default: base = 0.75;
  }
  switch (quantization) {
    case 'BF16': return base;
    case 'FP8': return base * 0.97;
    case 'INT4': return base * 0.89;
    default: return base * 0.95;
  }
}

function buildOffering(
  model: string,
  quantization: string,
  gpuType: string,
  inputPer1M: number,
  outputPer1M: number,
  now: string,
  dataSource: 'api' | 'manual',
): Offering {
  return {
    id: makeOfferingId(PROVIDER_ID, model, quantization, gpuType, 'global'),
    providerId: PROVIDER_ID,
    providerName: PROVIDER_NAME,
    providerType: PROVIDER_TYPE,
    model,
    modelShort: shortModelName(model),
    capabilityTier: assignCapabilityTier(model),
    quantization,
    gpuType,
    region: 'global',
    priceInputPerMillion: inputPer1M,
    priceOutputPerMillion: outputPer1M,
    pricePerGpuHour: null,
    qualityScore: getQualityScore(model, quantization),
    reliabilityScore: 0.5,
    latencyP50Ms: null,
    latencyP95Ms: null,
    observationCount: 0,
    status: 'active',
    lastPriceUpdate: now,
    lastObservationUpdate: null,
    dataSource,
  };
}

function isExcluded(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  return EXCLUDED_PATTERNS.some(p => lower.includes(p));
}

/**
 * Fetch model list from Hyperbolic API and match against pricing map.
 * Returns null on failure so caller can fall back to static data.
 */
async function fetchLivePricing(): Promise<Offering[] | null> {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) return null;

  const data: { data?: Array<{ id: string; object: string }> } = await response.json();
  if (!data.data || !Array.isArray(data.data)) return null;

  const now = new Date().toISOString();
  const offerings: Offering[] = [];

  for (const m of data.data) {
    if (isExcluded(m.id)) continue;

    // Try matching with default FP8 quantization first
    const fp8Key = `${m.id}:FP8`;
    const bf16Key = `${m.id}:BF16`;

    const fp8Pricing = PRICING_MAP[fp8Key];
    const bf16Pricing = PRICING_MAP[bf16Key];

    if (fp8Pricing) {
      offerings.push(buildOffering(
        m.id, fp8Pricing.quantization, fp8Pricing.gpuType,
        fp8Pricing.inputPer1M, fp8Pricing.outputPer1M, now, 'api',
      ));
    }
    if (bf16Pricing) {
      offerings.push(buildOffering(
        m.id, bf16Pricing.quantization, bf16Pricing.gpuType,
        bf16Pricing.inputPer1M, bf16Pricing.outputPer1M, now, 'api',
      ));
    }
  }

  return offerings.length > 0 ? offerings : null;
}

export const hyperbolicAdapter: ProviderAdapter = {
  providerId: PROVIDER_ID,
  providerName: PROVIDER_NAME,
  providerType: PROVIDER_TYPE,

  async getOfferings(): Promise<Offering[]> {
    try {
      const live = await fetchLivePricing();
      if (live) return live;
    } catch (err) {
      console.warn(`Hyperbolic live fetch failed, using fallback: ${err instanceof Error ? err.message : err}`);
    }

    // Fallback to static data
    const now = new Date().toISOString();
    return FALLBACK_MODELS.map(m =>
      buildOffering(m.model, m.quantization, m.gpuType, m.inputPer1M, m.outputPer1M, now, 'manual'),
    );
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(API_URL, {
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
