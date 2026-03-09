/**
 * Volt HQ — Groq Provider Adapter
 *
 * Static pricing data for Groq's inference API.
 * Groq uses custom LPU (Language Processing Unit) hardware for
 * extremely fast inference. Pricing is per-token.
 *
 * Pricing: https://groq.com/pricing/
 * Docs: https://console.groq.com/docs
 */

import type { Offering, ProviderAdapter, ProviderType } from '@volthq/core';
import { makeOfferingId, shortModelName, assignCapabilityTier } from '@volthq/core';

const PROVIDER_ID = 'groq';
const PROVIDER_NAME = 'Groq';
const PROVIDER_TYPE: ProviderType = 'centralized';

/**
 * Known Groq model pricing as of March 2026.
 * Source: https://groq.com/pricing/
 *
 * Manually maintained. Last verified: March 2026.
 */
const GROQ_MODELS: Array<{
  model: string;
  inputPer1M: number;
  outputPer1M: number;
}> = [
  { model: 'meta-llama/Llama-3.1-70B-Instruct', inputPer1M: 0.59, outputPer1M: 0.79 },
  { model: 'meta-llama/Llama-3.1-8B-Instruct', inputPer1M: 0.05, outputPer1M: 0.08 },
  { model: 'mistralai/Mixtral-8x7B-Instruct-v0.1', inputPer1M: 0.24, outputPer1M: 0.24 },
];

/**
 * Quality scores for Groq offerings.
 * Groq serves models at full precision on LPU hardware.
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
 * Groq adapter implementation.
 */
export const groqAdapter: ProviderAdapter = {
  providerId: PROVIDER_ID,
  providerName: PROVIDER_NAME,
  providerType: PROVIDER_TYPE,

  async getOfferings(): Promise<Offering[]> {
    const now = new Date().toISOString();

    return GROQ_MODELS.map(m => {
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
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
