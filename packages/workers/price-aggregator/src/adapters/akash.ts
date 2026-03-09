/**
 * Volt HQ — Akash Network Provider Adapter
 *
 * Fetches real-time GPU pricing from Akash's console API.
 * Akash is a decentralized compute marketplace — pricing is per GPU-hour.
 * We convert to per-token estimates using gpuHourToPerToken() from @volthq/core.
 *
 * API: https://console-api.akash.network/v1/gpu-prices
 * Docs: https://akash.network/docs
 */

import {
  Offering,
  ProviderAdapter,
  ProviderType,
} from '../../core/src/types.js';

import {
  makeOfferingId,
  assignCapabilityTier,
  gpuHourToPerToken,
} from '../../core/src/normalize.js';

const PROVIDER_ID = 'akash';
const PROVIDER_NAME = 'Akash';
const PROVIDER_TYPE: ProviderType = 'depin';
const API_URL = 'https://console-api.akash.network/v1/gpu-prices';

/**
 * GPU models we care about and their Volt-normalized names.
 */
const GPU_MAP: Record<string, { voltName: string; interface: string }> = {
  h100: { voltName: 'H100-SXM', interface: 'SXM5' },
  a100: { voltName: 'A100-80GB', interface: 'SXM4' },
};

/**
 * Models we generate offerings for on each GPU.
 * Akash rents raw GPUs — the user runs whatever model they want.
 * We estimate pricing for popular open-source models.
 */
const INFERENCE_MODELS: Array<{
  model: string;
  short: string;
  quantization: string;
}> = [
  { model: 'meta-llama/Llama-3.1-70B-Instruct', short: 'Llama-70B', quantization: 'FP8' },
  { model: 'meta-llama/Llama-3.1-8B-Instruct', short: 'Llama-8B', quantization: 'FP8' },
];

/**
 * Quality score for Akash offerings.
 * Same model quality as any other host, but DePIN has lower
 * baseline reliability until we have observation data.
 */
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

/** Response shape from the Akash GPU prices endpoint. */
interface AkashGpuPriceResponse {
  availability: { total: number; available: number };
  models: Array<{
    model: string;
    ram: string;
    interface: string;
    availability: { total: number; available: number };
    providerAvailability: { total: number; available: number };
    price: {
      currency: string;
      min: number | null;
      max: number | null;
      avg: number | null;
      median: number | null;
      weightedAverage: number | null;
    };
  }>;
}

/**
 * Akash adapter implementation.
 */
export const akashAdapter: ProviderAdapter = {
  providerId: PROVIDER_ID,
  providerName: PROVIDER_NAME,
  providerType: PROVIDER_TYPE,

  async getOfferings(): Promise<Offering[]> {
    const now = new Date().toISOString();
    const offerings: Offering[] = [];

    let apiData: AkashGpuPriceResponse;
    try {
      const response = await fetch(API_URL, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) return [];
      apiData = (await response.json()) as AkashGpuPriceResponse;
    } catch {
      return [];
    }

    for (const gpuEntry of apiData.models) {
      const gpuKey = gpuEntry.model.toLowerCase();
      const gpuInfo = GPU_MAP[gpuKey];
      if (!gpuInfo) continue;

      // Use median price — most representative of market rate
      const pricePerHour = gpuEntry.price.median;
      if (pricePerHour == null || pricePerHour <= 0) continue;

      // Skip GPUs with zero availability
      if (gpuEntry.availability.available <= 0) continue;

      for (const inferenceModel of INFERENCE_MODELS) {
        const perToken = gpuHourToPerToken(pricePerHour, inferenceModel.model, gpuInfo.voltName);
        if (!perToken) continue;

        const id = makeOfferingId(
          PROVIDER_ID,
          inferenceModel.model,
          inferenceModel.quantization,
          gpuInfo.voltName,
          'global',
        );

        offerings.push({
          id,
          providerId: PROVIDER_ID,
          providerName: PROVIDER_NAME,
          providerType: PROVIDER_TYPE,
          model: inferenceModel.model,
          modelShort: inferenceModel.short,
          capabilityTier: assignCapabilityTier(inferenceModel.model),
          quantization: inferenceModel.quantization,
          gpuType: gpuInfo.voltName,
          region: 'global',
          priceInputPerMillion: perToken.input,
          priceOutputPerMillion: perToken.output,
          pricePerGpuHour: pricePerHour,
          qualityScore: getQualityScore(inferenceModel.model, inferenceModel.quantization),
          reliabilityScore: 0.5,
          latencyP50Ms: null,
          latencyP95Ms: null,
          observationCount: 0,
          status: 'active',
          lastPriceUpdate: now,
          lastObservationUpdate: null,
          dataSource: 'api',
        });
      }
    }

    return offerings;
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
