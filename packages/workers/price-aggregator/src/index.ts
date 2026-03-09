/**
 * Volt HQ — Price Aggregator Worker
 *
 * Runs on a 60-second cron, polls all 8 provider adapters in parallel,
 * aggregates offerings, signs the feed with Ed25519, and writes to KV.
 *
 * Fail-open: if a provider fails, the others still publish.
 * Never blocks on a single provider.
 */

import type { Offering, ProviderAdapter } from '@volthq/core';
import { signFeed } from '@volthq/core';

import { hyperbolicAdapter } from './adapters/hyperbolic.js';
import { openaiAdapter } from './adapters/openai.js';
import { anthropicAdapter } from './adapters/anthropic.js';
import { akashAdapter } from './adapters/akash.js';
import { groqAdapter } from './adapters/groq.js';
import { togetherAdapter } from './adapters/together.js';
import { deepinfraAdapter } from './adapters/deepinfra.js';
import { fireworksAdapter } from './adapters/fireworks.js';

interface Env {
  VOLT_PRICING: KVNamespace;
  VOLT_SIGNING_KEY: string;
}

const adapters: ProviderAdapter[] = [
  hyperbolicAdapter,
  openaiAdapter,
  anthropicAdapter,
  akashAdapter,
  groqAdapter,
  togetherAdapter,
  deepinfraAdapter,
  fireworksAdapter,
];

/**
 * Poll all providers in parallel. Never throw — failed providers
 * return empty arrays and we log the error.
 */
async function aggregateOfferings(): Promise<{
  offerings: Offering[];
  errors: string[];
}> {
  const errors: string[] = [];

  const results = await Promise.allSettled(
    adapters.map(async (adapter) => {
      try {
        return await adapter.getOfferings();
      } catch (err) {
        errors.push(`${adapter.providerId}: ${err instanceof Error ? err.message : 'unknown error'}`);
        return [];
      }
    }),
  );

  const offerings: Offering[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      offerings.push(...result.value);
    }
  }

  return { offerings, errors };
}

export default {
  /**
   * Cron trigger — every 60 seconds.
   * Aggregates pricing from all providers and writes signed feed to KV.
   */
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    const startMs = Date.now();

    const { offerings, errors } = await aggregateOfferings();

    if (errors.length > 0) {
      console.warn(`Provider errors (${errors.length}):`, errors.join('; '));
    }

    if (offerings.length === 0) {
      console.error('No offerings from any provider — skipping KV write');
      return;
    }

    const timestamp = new Date().toISOString();
    const offeringsJson = JSON.stringify(offerings);

    // Sign the feed if signing key is configured
    let signature = '';
    if (env.VOLT_SIGNING_KEY) {
      try {
        signature = await signFeed(timestamp, offeringsJson, env.VOLT_SIGNING_KEY);
      } catch (err) {
        console.error('Feed signing failed:', err instanceof Error ? err.message : err);
        // Continue without signature — fail-open
      }
    }

    const feed = {
      version: 1,
      timestamp,
      signature,
      offeringCount: offerings.length,
      offerings,
    };

    await env.VOLT_PRICING.put('v1/prices', JSON.stringify(feed), {
      expirationTtl: 300, // 5-minute safety TTL
    });

    const durationMs = Date.now() - startMs;
    console.log(
      `Feed published: ${offerings.length} offerings from ${adapters.length} providers in ${durationMs}ms`,
    );
  },

  /**
   * HTTP handler — health check and manual trigger.
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      const feed = await env.VOLT_PRICING.get('v1/prices');
      return new Response(
        JSON.stringify({
          status: feed ? 'ok' : 'no_feed',
          worker: 'price-aggregator',
          providers: adapters.map((a) => a.providerId),
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Manual trigger (for testing)
    if (url.pathname === '/trigger' && request.method === 'POST') {
      await this.scheduled(
        { scheduledTime: Date.now(), cron: 'manual' } as ScheduledController,
        env,
        ctx,
      );
      return new Response('Triggered', { status: 200 });
    }

    return new Response('Volt HQ Price Aggregator', { status: 200 });
  },
};
