/**
 * Volt HQ — Together AI Provider Adapter
 *
 * Static pricing data for Together AI's inference API.
 * Together AI offers serverless and dedicated inference for
 * open-source models with per-token pricing.
 *
 * Pricing: https://www.together.ai/pricing
 * Docs: https://docs.together.ai
 */

import {
  Offering,
  ProviderAdapter,
  ProviderType,
} from '../../core/src/types.js';

import {
  makeOfferingId,
  shortModelName,
  assignCapabilityTier,
} from '../../core/src/normalize.js';

const PROVIDER_ID = 'together';
const PROVIDER_NAME = 'Together AI';
const PROVIDER_TYPE: ProviderType = 'centralized';

/**
 * Known Together AI model pricing as of March 2026.
 * Source: https://www.together.ai/pricing
 *
 * Manually maintained. Last verified: March 2026.
 */
const TOGETHER_MODELS: Array<{
  model: string;
  inputPer1M: number;
  outputPer1M: number;
}> = [
  { model: 'meta-llama/Llama-3.1-70B-Instruct', inputPer1M: 0.88, outputPer1M: 0.88 },
  { model: 'meta-llama/Llama-3.1-8B-Instruct', inputPer1M: 0.18, outputPer1M: 0.18 },
  { model: 'deepseek-ai/DeepSeek-V3', inputPer1M: 0.50, outputPer1M: 0.90 },
];

/**
 * Quality scores for Together AI offerings.
 * Together AI serves models at full precision.
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
 * Together AI adapter implementation.
 */
export const togetherAdapter: ProviderAdapter = {
  providerId: PROVIDER_ID,
  providerName: PROVIDER_NAME,
  providerType: PROVIDER_TYPE,

  async getOfferings(): Promise<Offering[]> {
    const now = new Date().toISOString();

    return TOGETHER_MODELS.map(m => {
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
      const response = await fetch('https://api.together.xyz/v1/models', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
