/**
 * Volt HQ — Fireworks AI Provider Adapter
 *
 * Static pricing data for Fireworks AI's inference API.
 * Fireworks AI offers optimized inference for open-source models
 * with competitive pricing and low latency.
 *
 * Pricing: https://fireworks.ai/pricing
 * Docs: https://docs.fireworks.ai
 */

import type { Offering, ProviderAdapter, ProviderType } from '@volthq/core';
import { makeOfferingId, shortModelName, assignCapabilityTier } from '@volthq/core';

const PROVIDER_ID = 'fireworks';
const PROVIDER_NAME = 'Fireworks AI';
const PROVIDER_TYPE: ProviderType = 'centralized';

/**
 * Known Fireworks AI model pricing as of March 2026.
 * Source: https://fireworks.ai/pricing
 *
 * Manually maintained. Last verified: March 2026.
 */
const FIREWORKS_MODELS: Array<{
  model: string;
  inputPer1M: number;
  outputPer1M: number;
}> = [
  { model: 'meta-llama/Llama-3.1-70B-Instruct', inputPer1M: 0.70, outputPer1M: 0.70 },
  { model: 'meta-llama/Llama-3.1-8B-Instruct', inputPer1M: 0.10, outputPer1M: 0.10 },
  { model: 'deepseek-ai/DeepSeek-R1', inputPer1M: 0.55, outputPer1M: 2.19 },
];

/**
 * Quality scores for Fireworks AI offerings.
 * Fireworks serves models with optimized inference engines.
 */
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

/**
 * Fireworks AI adapter implementation.
 */
export const fireworksAdapter: ProviderAdapter = {
  providerId: PROVIDER_ID,
  providerName: PROVIDER_NAME,
  providerType: PROVIDER_TYPE,

  async getOfferings(): Promise<Offering[]> {
    const now = new Date().toISOString();

    return FIREWORKS_MODELS.map(m => {
      const id = makeOfferingId(PROVIDER_ID, m.model, null, null, 'global');

      return {
        id,
        providerId: PROVIDER_ID,
        providerName: PROVIDER_NAME,
        providerType: PROVIDER_TYPE,
        model: m.model,
        modelShort: shortModelName(m.model),
        capabilityTier: assignCapabilityTier(m.model),
        quantization: null,
        gpuType: null,
        region: 'global',
        priceInputPerMillion: m.inputPer1M,
        priceOutputPerMillion: m.outputPer1M,
        pricePerGpuHour: null,
        qualityScore: getQualityScore(m.model),
        reliabilityScore: 0.90,
        latencyP50Ms: null,
        latencyP95Ms: null,
        observationCount: 0,
        status: 'active',
        lastPriceUpdate: now,
        lastObservationUpdate: null,
        dataSource: 'manual',
      };
    });
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('https://api.fireworks.ai/inference/v1/models', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
