/**
 * Volt HQ — Anthropic Provider Adapter (Static)
 * 
 * Source: https://docs.anthropic.com/en/docs/about-claude/models
 * Last verified: March 2026
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

const PROVIDER_ID = 'anthropic';
const PROVIDER_NAME = 'Anthropic';
const PROVIDER_TYPE: ProviderType = 'centralized';

const ANTHROPIC_MODELS: Array<{
  model: string;
  inputPer1M: number;
  outputPer1M: number;
}> = [
  { model: 'claude-opus-4-6', inputPer1M: 15.00, outputPer1M: 75.00 },
  { model: 'claude-sonnet-4-6', inputPer1M: 3.00, outputPer1M: 15.00 },
  { model: 'claude-haiku-4-5', inputPer1M: 0.80, outputPer1M: 4.00 },
  { model: 'claude-sonnet-4-5', inputPer1M: 3.00, outputPer1M: 15.00 },
];

export const anthropicAdapter: ProviderAdapter = {
  providerId: PROVIDER_ID,
  providerName: PROVIDER_NAME,
  providerType: PROVIDER_TYPE,
  
  async getOfferings(): Promise<Offering[]> {
    const now = new Date().toISOString();
    
    return ANTHROPIC_MODELS.map(m => ({
      id: makeOfferingId(PROVIDER_ID, m.model, null, null, 'global'),
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
      qualityScore: assignCapabilityTier(m.model) === 1 ? 0.97 :
                     assignCapabilityTier(m.model) === 2 ? 0.93 : 0.86,
      reliabilityScore: 0.95,
      latencyP50Ms: null,
      latencyP95Ms: null,
      observationCount: 0,
      status: 'active',
      lastPriceUpdate: now,
      lastObservationUpdate: null,
      dataSource: 'manual',
    }));
  },
  
  async healthCheck(): Promise<boolean> {
    return true;
  },
};
