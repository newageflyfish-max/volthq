/**
 * Volt HQ — Fireworks AI Provider Adapter
 *
 * Attempts to fetch the model list from Fireworks AI's API and match
 * against a known pricing map. Falls back to static pricing if the API
 * is unreachable (requires auth).
 *
 * API: https://api.fireworks.ai/inference/v1/models (requires API key)
 * Pricing: https://fireworks.ai/pricing
 */

import type { Offering, ProviderAdapter, ProviderType } from '@volthq/core';
import { makeOfferingId, shortModelName, assignCapabilityTier } from '@volthq/core';

const PROVIDER_ID = 'fireworks';
const PROVIDER_NAME = 'Fireworks AI';
const PROVIDER_TYPE: ProviderType = 'centralized';

const API_URL = 'https://api.fireworks.ai/inference/v1/models';

/**
 * Known Fireworks AI pricing map.
 * Fireworks' API does not return pricing data, so we maintain a map.
 * Source: https://fireworks.ai/pricing — last verified March 2026.
 */
const PRICING_MAP: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  'accounts/fireworks/models/llama-v3p1-70b-instruct': { inputPer1M: 0.70, outputPer1M: 0.70 },
  'accounts/fireworks/models/llama-v3p1-8b-instruct': { inputPer1M: 0.10, outputPer1M: 0.10 },
  'accounts/fireworks/models/deepseek-r1': { inputPer1M: 0.55, outputPer1M: 2.19 },
  'accounts/fireworks/models/deepseek-v3': { inputPer1M: 0.30, outputPer1M: 0.88 },
  'accounts/fireworks/models/llama-v3p3-70b-instruct': { inputPer1M: 0.70, outputPer1M: 0.70 },
  'accounts/fireworks/models/qwen2p5-72b-instruct': { inputPer1M: 0.70, outputPer1M: 0.70 },
  // Normalized model names (match from fallback)
  'meta-llama/Llama-3.1-70B-Instruct': { inputPer1M: 0.70, outputPer1M: 0.70 },
  'meta-llama/Llama-3.1-8B-Instruct': { inputPer1M: 0.10, outputPer1M: 0.10 },
  'deepseek-ai/DeepSeek-R1': { inputPer1M: 0.55, outputPer1M: 2.19 },
};

/** Model ID patterns to exclude (embeddings, audio, image, tools). */
const EXCLUDED_PATTERNS = [
  'embed', 'whisper', 'tts', 'speech', 'image',
  'stable-diffusion', 'sdxl', 'playground',
];

/** Static fallback — used when live API is unreachable. */
const FALLBACK_MODELS: Array<{
  model: string;
  inputPer1M: number;
  outputPer1M: number;
}> = [
  { model: 'meta-llama/Llama-3.1-70B-Instruct', inputPer1M: 0.70, outputPer1M: 0.70 },
  { model: 'meta-llama/Llama-3.1-8B-Instruct', inputPer1M: 0.10, outputPer1M: 0.10 },
  { model: 'deepseek-ai/DeepSeek-R1', inputPer1M: 0.55, outputPer1M: 2.19 },
];

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

function isExcluded(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  return EXCLUDED_PATTERNS.some(p => lower.includes(p));
}

/**
 * Fetch model list from Fireworks AI and match against pricing map.
 * Returns null on failure so caller can fall back to static data.
 */
async function fetchLivePricing(): Promise<Offering[] | null> {
  const response = await fetch(API_URL, {
    method: 'GET',
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) return null;

  const data: { data?: Array<{ id: string; object: string }> } = await response.json();
  if (!data.data || !Array.isArray(data.data)) return null;

  const now = new Date().toISOString();
  const offerings: Offering[] = [];

  for (const m of data.data) {
    if (isExcluded(m.id)) continue;

    const pricing = PRICING_MAP[m.id];
    if (!pricing) continue;

    offerings.push(buildOffering(m.id, pricing.inputPer1M, pricing.outputPer1M, now, 'api'));
  }

  return offerings.length > 0 ? offerings : null;
}

export const fireworksAdapter: ProviderAdapter = {
  providerId: PROVIDER_ID,
  providerName: PROVIDER_NAME,
  providerType: PROVIDER_TYPE,

  async getOfferings(): Promise<Offering[]> {
    try {
      const live = await fetchLivePricing();
      if (live) return live;
    } catch (err) {
      console.warn(`Fireworks AI live fetch failed, using fallback: ${err instanceof Error ? err.message : err}`);
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
