/**
 * Volt HQ — DeepInfra Provider Adapter
 *
 * Static pricing data for DeepInfra's inference API.
 * DeepInfra offers serverless inference on open-source models
 * at competitive per-token pricing.
 *
 * Pricing: https://deepinfra.com/pricing
 * Docs: https://deepinfra.com/docs
 */

import type { Offering, ProviderAdapter, ProviderType } from '@volthq/core';
import { makeOfferingId, shortModelName, assignCapabilityTier } from '@volthq/core';

const PROVIDER_ID = 'deepinfra';
const PROVIDER_NAME = 'DeepInfra';
const PROVIDER_TYPE: ProviderType = 'centralized';

/**
 * Known DeepInfra model pricing as of March 2026.
 * Source: https://deepinfra.com/pricing
 *
 * Manually maintained. Last verified: March 2026.
 */
const DEEPINFRA_MODELS: Array<{
  model: string;
  inputPer1M: number;
  outputPer1M: number;
}> = [
  { model: 'meta-llama/Llama-3.1-70B-Instruct', inputPer1M: 0.20, outputPer1M: 0.27 },
  { model: 'meta-llama/Llama-3.1-8B-Instruct', inputPer1M: 0.03, outputPer1M: 0.05 },
  { model: 'deepseek-ai/DeepSeek-V3', inputPer1M: 0.30, outputPer1M: 0.60 },
];

/**
 * Quality scores for DeepInfra offerings.
 * DeepInfra serves models at full precision on A100/H100 clusters.
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
 * DeepInfra adapter implementation.
 */
export const deepinfraAdapter: ProviderAdapter = {
  providerId: PROVIDER_ID,
  providerName: PROVIDER_NAME,
  providerType: PROVIDER_TYPE,

  async getOfferings(): Promise<Offering[]> {
    const now = new Date().toISOString();

    return DEEPINFRA_MODELS.map(m => {
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
      const response = await fetch('https://api.deepinfra.com/v1/openai/models', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
