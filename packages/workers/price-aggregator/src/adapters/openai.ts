/**
 * Volt HQ — OpenAI Provider Adapter (Static)
 * 
 * OpenAI pricing is published and changes infrequently.
 * This adapter provides static pricing data that's manually updated.
 * 
 * Source: https://openai.com/pricing
 * Last verified: March 2026
 */

import type { Offering, ProviderAdapter, ProviderType } from '@volthq/core';
import { makeOfferingId, shortModelName, assignCapabilityTier } from '@volthq/core';

const PROVIDER_ID = 'openai';
const PROVIDER_NAME = 'OpenAI';
const PROVIDER_TYPE: ProviderType = 'centralized';

const OPENAI_MODELS: Array<{
  model: string;
  inputPer1M: number;
  outputPer1M: number;
}> = [
  { model: 'gpt-4o', inputPer1M: 2.50, outputPer1M: 10.00 },
  { model: 'gpt-4o-mini', inputPer1M: 0.15, outputPer1M: 0.60 },
  { model: 'gpt-4-turbo', inputPer1M: 10.00, outputPer1M: 30.00 },
  { model: 'gpt-3.5-turbo', inputPer1M: 0.50, outputPer1M: 1.50 },
  { model: 'o1', inputPer1M: 15.00, outputPer1M: 60.00 },
  { model: 'o1-mini', inputPer1M: 3.00, outputPer1M: 12.00 },
  { model: 'o3-mini', inputPer1M: 1.10, outputPer1M: 4.40 },
];

export const openaiAdapter: ProviderAdapter = {
  providerId: PROVIDER_ID,
  providerName: PROVIDER_NAME,
  providerType: PROVIDER_TYPE,
  
  async getOfferings(): Promise<Offering[]> {
    const now = new Date().toISOString();
    
    return OPENAI_MODELS.map(m => ({
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
      qualityScore: assignCapabilityTier(m.model) === 1 ? 0.98 : 
                     assignCapabilityTier(m.model) === 2 ? 0.92 : 0.85,
      reliabilityScore: 0.95, // OpenAI is highly reliable
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
    return true; // Static adapter, always healthy
  },
};
