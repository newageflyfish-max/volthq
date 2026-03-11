/**
 * Volt HQ — Together AI Provider Adapter
 *
 * Attempts to fetch the model list from Together AI's API and extract
 * pricing data. Falls back to static pricing if the API is unreachable
 * (requires auth) or pricing data is missing.
 *
 * API: https://api.together.xyz/v1/models (requires API key)
 * Pricing: https://www.together.ai/pricing
 */

import type { Offering, ProviderAdapter, ProviderType } from '@volthq/core';
import { makeOfferingId, shortModelName, assignCapabilityTier } from '@volthq/core';

const PROVIDER_ID = 'together';
const PROVIDER_NAME = 'Together AI';
const PROVIDER_TYPE: ProviderType = 'centralized';

const API_URL = 'https://api.together.xyz/v1/models';

/**
 * Known Together AI pricing map as fallback.
 * Together's API may return pricing inline; if so, we prefer live data.
 * Source: https://www.together.ai/pricing — last verified March 2026.
 */
const PRICING_MAP: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  'meta-llama/Llama-3.1-70B-Instruct': { inputPer1M: 0.88, outputPer1M: 0.88 },
  'meta-llama/Llama-3.1-8B-Instruct': { inputPer1M: 0.18, outputPer1M: 0.18 },
  'deepseek-ai/DeepSeek-V3': { inputPer1M: 0.50, outputPer1M: 0.90 },
  'meta-llama/Llama-3.3-70B-Instruct-Turbo': { inputPer1M: 0.88, outputPer1M: 0.88 },
  'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo': { inputPer1M: 3.50, outputPer1M: 3.50 },
  'Qwen/Qwen2.5-72B-Instruct-Turbo': { inputPer1M: 1.20, outputPer1M: 1.20 },
  'deepseek-ai/DeepSeek-R1': { inputPer1M: 0.75, outputPer1M: 2.50 },
};

/** Model types to include from Together's API. */
const INCLUDED_TYPES = new Set(['chat', 'language', 'code']);

/** Static fallback — used when live API is unreachable. */
const FALLBACK_MODELS: Array<{
  model: string;
  inputPer1M: number;
  outputPer1M: number;
}> = [
  { model: 'meta-llama/Llama-3.1-70B-Instruct', inputPer1M: 0.88, outputPer1M: 0.88 },
  { model: 'meta-llama/Llama-3.1-8B-Instruct', inputPer1M: 0.18, outputPer1M: 0.18 },
  { model: 'deepseek-ai/DeepSeek-V3', inputPer1M: 0.50, outputPer1M: 0.90 },
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

/**
 * Fetch model list from Together AI and extract pricing.
 * Together's API may return pricing inline or we match against PRICING_MAP.
 * Returns null on failure so caller can fall back to static data.
 */
async function fetchLivePricing(): Promise<Offering[] | null> {
  const response = await fetch(API_URL, {
    method: 'GET',
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) return null;

  const models: Array<{
    id: string;
    type?: string;
    pricing?: {
      input?: number;
      output?: number;
      per_million_input?: number;
      per_million_output?: number;
    };
  }> = await response.json();

  if (!Array.isArray(models)) return null;

  const now = new Date().toISOString();
  const offerings: Offering[] = [];

  for (const m of models) {
    // Filter to chat/language models only
    if (m.type && !INCLUDED_TYPES.has(m.type)) continue;

    let inputPer1M: number | undefined;
    let outputPer1M: number | undefined;

    // Try to extract inline pricing from the API response
    if (m.pricing) {
      if (m.pricing.per_million_input != null && m.pricing.per_million_output != null) {
        inputPer1M = m.pricing.per_million_input;
        outputPer1M = m.pricing.per_million_output;
      } else if (m.pricing.input != null && m.pricing.output != null) {
        // Per-token pricing → convert to per-million
        inputPer1M = m.pricing.input * 1_000_000;
        outputPer1M = m.pricing.output * 1_000_000;
      }
    }

    // Fall back to pricing map if no inline pricing
    if (inputPer1M == null || outputPer1M == null) {
      const known = PRICING_MAP[m.id];
      if (!known) continue;
      inputPer1M = known.inputPer1M;
      outputPer1M = known.outputPer1M;
    }

    if (inputPer1M <= 0 || outputPer1M <= 0) continue;

    offerings.push(buildOffering(m.id, inputPer1M, outputPer1M, now, 'api'));
  }

  return offerings.length > 0 ? offerings : null;
}

export const togetherAdapter: ProviderAdapter = {
  providerId: PROVIDER_ID,
  providerName: PROVIDER_NAME,
  providerType: PROVIDER_TYPE,

  async getOfferings(): Promise<Offering[]> {
    try {
      const live = await fetchLivePricing();
      if (live) return live;
    } catch (err) {
      console.warn(`Together AI live fetch failed, using fallback: ${err instanceof Error ? err.message : err}`);
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
