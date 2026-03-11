/**
 * Volt HQ — DeepInfra Provider Adapter
 *
 * Fetches live pricing from DeepInfra's public models API.
 * Falls back to static pricing if the API is unreachable.
 *
 * API: https://api.deepinfra.com/models/list (public, no auth)
 * Pricing: https://deepinfra.com/pricing
 */

import type { Offering, ProviderAdapter, ProviderType } from '@volthq/core';
import { makeOfferingId, shortModelName, assignCapabilityTier } from '@volthq/core';

const PROVIDER_ID = 'deepinfra';
const PROVIDER_NAME = 'DeepInfra';
const PROVIDER_TYPE: ProviderType = 'centralized';

const API_URL = 'https://api.deepinfra.com/models/list';

/** Static fallback — used when live API is unreachable. */
const FALLBACK_MODELS: Array<{
  model: string;
  inputPer1M: number;
  outputPer1M: number;
}> = [
  { model: 'meta-llama/Llama-3.1-70B-Instruct', inputPer1M: 0.20, outputPer1M: 0.27 },
  { model: 'meta-llama/Llama-3.1-8B-Instruct', inputPer1M: 0.03, outputPer1M: 0.05 },
  { model: 'deepseek-ai/DeepSeek-V3', inputPer1M: 0.30, outputPer1M: 0.60 },
];

/** Model types to exclude — only keep text generation / chat models. */
const EXCLUDED_TYPES = new Set([
  'embeddings',
  'automatic-speech-recognition',
  'text-to-image',
  'text-to-speech',
  'image-classification',
  'zero-shot-image-classification',
  'object-detection',
]);

function getQualityScore(model: string): number {
  const tier = assignCapabilityTier(model);
  switch (tier) {
    case 1: return 0.95;
    case 2: return 0.88;
    case 3: return 0.78;
    case 4: return 0.65;
    case 5: return 0.50;
    default: return 0.75;
  }
}

function buildOffering(
  model: string,
  inputPer1M: number,
  outputPer1M: number,
  now: string,
  dataSource: 'api' | 'manual',
): Offering {
  return {
    id: makeOfferingId(PROVIDER_ID, model, null, null, 'global'),
    providerId: PROVIDER_ID,
    providerName: PROVIDER_NAME,
    providerType: PROVIDER_TYPE,
    model,
    modelShort: shortModelName(model),
    capabilityTier: assignCapabilityTier(model),
    quantization: null,
    gpuType: null,
    region: 'global',
    priceInputPerMillion: inputPer1M,
    priceOutputPerMillion: outputPer1M,
    pricePerGpuHour: null,
    qualityScore: getQualityScore(model),
    reliabilityScore: 0.90,
    latencyP50Ms: null,
    latencyP95Ms: null,
    observationCount: 0,
    status: 'active',
    lastPriceUpdate: now,
    lastObservationUpdate: null,
    dataSource,
  };
}

/**
 * Fetch live pricing from DeepInfra's public API.
 * Returns null on failure so caller can fall back to static data.
 */
async function fetchLivePricing(): Promise<Offering[] | null> {
  const response = await fetch(API_URL, {
    method: 'GET',
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) return null;

  const models: Array<{
    model_name: string;
    type: string;
    deprecated?: boolean;
    pricing?: {
      cents_per_input_token: number | null;
      cents_per_output_token: number | null;
    };
  }> = await response.json();

  if (!Array.isArray(models)) return null;

  const now = new Date().toISOString();
  const offerings: Offering[] = [];

  for (const m of models) {
    // Skip non-text-generation models
    if (EXCLUDED_TYPES.has(m.type)) continue;
    if (m.type !== 'text-generation') continue;

    // Skip deprecated models
    if (m.deprecated) continue;

    // Skip models without pricing data
    const pricing = m.pricing;
    if (!pricing) continue;
    if (pricing.cents_per_input_token == null || pricing.cents_per_output_token == null) continue;
    if (pricing.cents_per_input_token <= 0 || pricing.cents_per_output_token <= 0) continue;

    // Convert cents/token → $/M tokens
    // cents_per_token * 1_000_000 / 100 = cents_per_token * 10_000
    const inputPer1M = pricing.cents_per_input_token * 10_000;
    const outputPer1M = pricing.cents_per_output_token * 10_000;

    offerings.push(buildOffering(m.model_name, inputPer1M, outputPer1M, now, 'api'));
  }

  return offerings.length > 0 ? offerings : null;
}

export const deepinfraAdapter: ProviderAdapter = {
  providerId: PROVIDER_ID,
  providerName: PROVIDER_NAME,
  providerType: PROVIDER_TYPE,

  async getOfferings(): Promise<Offering[]> {
    try {
      const live = await fetchLivePricing();
      if (live) return live;
    } catch (err) {
      console.warn(`DeepInfra live fetch failed, using fallback: ${err instanceof Error ? err.message : err}`);
    }

    // Fallback to static data
    const now = new Date().toISOString();
    return FALLBACK_MODELS.map(m => buildOffering(m.model, m.inputPer1M, m.outputPer1M, now, 'manual'));
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
