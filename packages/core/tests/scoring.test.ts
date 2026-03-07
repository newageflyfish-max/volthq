/**
 * Volt HQ — Scoring Algorithm Tests
 * 
 * The council demanded 100+ test cases for this module.
 * The scoring function is the brain of the product.
 * A bug here affects every routing decision for every user.
 */

import { scoreOfferings, generateRecommendation, comparePrices } from '../src/scoring.js';
import { Offering, RoutingProfile, DEFAULT_ROUTING_PROFILE } from '../src/types.js';

// ═══════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════

function makeOffering(overrides: Partial<Offering> = {}): Offering {
  return {
    id: 'test:model:default:unknown:global',
    providerId: 'test-provider',
    providerName: 'Test Provider',
    providerType: 'centralized',
    model: 'test-model',
    modelShort: 'Test',
    capabilityTier: 2,
    quantization: null,
    gpuType: null,
    region: 'global',
    priceInputPerMillion: 1.00,
    priceOutputPerMillion: 1.00,
    pricePerGpuHour: null,
    qualityScore: 0.9,
    reliabilityScore: 0.9,
    latencyP50Ms: 200,
    latencyP95Ms: 500,
    observationCount: 100,
    status: 'active',
    lastPriceUpdate: '2026-03-06T00:00:00Z',
    lastObservationUpdate: '2026-03-06T00:00:00Z',
    dataSource: 'benchmark',
    ...overrides,
  };
}

const cheap = makeOffering({ id: 'cheap', providerId: 'cheap', providerName: 'Cheap', priceInputPerMillion: 0.10, priceOutputPerMillion: 0.10 });
const expensive = makeOffering({ id: 'expensive', providerId: 'expensive', providerName: 'Expensive', priceInputPerMillion: 10.00, priceOutputPerMillion: 10.00 });
const midPrice = makeOffering({ id: 'mid', providerId: 'mid', providerName: 'Mid', priceInputPerMillion: 2.00, priceOutputPerMillion: 2.00 });
const fastProvider = makeOffering({ id: 'fast', providerId: 'fast', providerName: 'Fast', latencyP95Ms: 100 });
const slowProvider = makeOffering({ id: 'slow', providerId: 'slow', providerName: 'Slow', latencyP95Ms: 8000 });
const highQuality = makeOffering({ id: 'hq', providerId: 'hq', providerName: 'HQ', qualityScore: 0.99 });
const lowQuality = makeOffering({ id: 'lq', providerId: 'lq', providerName: 'LQ', qualityScore: 0.5 });
const reliable = makeOffering({ id: 'reliable', providerId: 'reliable', providerName: 'Reliable', reliabilityScore: 0.99 });
const unreliable = makeOffering({ id: 'unreliable', providerId: 'unreliable', providerName: 'Unreliable', reliabilityScore: 0.3 });
const newProvider = makeOffering({ id: 'new', providerId: 'new', providerName: 'New', observationCount: 0, reliabilityScore: 0.5, latencyP50Ms: null, latencyP95Ms: null });
const offlineProvider = makeOffering({ id: 'offline', providerId: 'offline', providerName: 'Offline', status: 'offline' });
const depinCheap = makeOffering({ id: 'depin', providerId: 'akash', providerName: 'Akash', providerType: 'depin', priceInputPerMillion: 0.05, priceOutputPerMillion: 0.05 });

// ═══════════════════════════════════════════════════════
// TESTS: BASIC SCORING
// ═══════════════════════════════════════════════════════

describe('scoreOfferings', () => {
  test('returns empty array for empty input', () => {
    expect(scoreOfferings([])).toEqual([]);
  });

  test('returns empty array when all offerings are offline', () => {
    expect(scoreOfferings([offlineProvider])).toEqual([]);
  });

  test('returns single offering when only one is eligible', () => {
    const result = scoreOfferings([cheap]);
    expect(result).toHaveLength(1);
    expect(result[0].offering.id).toBe('cheap');
  });

  test('scores are between 0 and 1', () => {
    const result = scoreOfferings([cheap, expensive, midPrice, fastProvider, slowProvider]);
    for (const scored of result) {
      expect(scored.score).toBeGreaterThanOrEqual(0);
      expect(scored.score).toBeLessThanOrEqual(1);
    }
  });

  test('results are sorted by score descending', () => {
    const result = scoreOfferings([cheap, expensive, midPrice]);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
    }
  });

  test('all four score components are present in breakdown', () => {
    const result = scoreOfferings([cheap]);
    const bd = result[0].breakdown;
    expect(bd.qualityComponent).toBeDefined();
    expect(bd.reliabilityComponent).toBeDefined();
    expect(bd.latencyComponent).toBeDefined();
    expect(bd.priceComponent).toBeDefined();
  });

  test('all score components are between 0 and 1', () => {
    const offerings = [cheap, expensive, fastProvider, slowProvider, highQuality, lowQuality, reliable, unreliable, newProvider];
    const result = scoreOfferings(offerings);
    for (const scored of result) {
      expect(scored.breakdown.qualityComponent).toBeGreaterThanOrEqual(0);
      expect(scored.breakdown.qualityComponent).toBeLessThanOrEqual(1);
      expect(scored.breakdown.reliabilityComponent).toBeGreaterThanOrEqual(0);
      expect(scored.breakdown.reliabilityComponent).toBeLessThanOrEqual(1);
      expect(scored.breakdown.latencyComponent).toBeGreaterThanOrEqual(0);
      expect(scored.breakdown.latencyComponent).toBeLessThanOrEqual(1);
      expect(scored.breakdown.priceComponent).toBeGreaterThanOrEqual(0);
      expect(scored.breakdown.priceComponent).toBeLessThanOrEqual(1);
    }
  });
});

// ═══════════════════════════════════════════════════════
// TESTS: COST OPTIMIZATION
// ═══════════════════════════════════════════════════════

describe('cost optimization', () => {
  const costProfile: RoutingProfile = { ...DEFAULT_ROUTING_PROFILE, optimize: 'cost' };

  test('cheapest provider ranks first when optimizing for cost', () => {
    const result = scoreOfferings([expensive, midPrice, cheap], costProfile);
    expect(result[0].offering.id).toBe('cheap');
  });

  test('DePIN provider beats centralized on cost optimization', () => {
    const result = scoreOfferings([midPrice, depinCheap], costProfile);
    expect(result[0].offering.id).toBe('depin');
  });

  test('price component dominates in cost optimization', () => {
    const result = scoreOfferings([cheap, expensive], costProfile);
    expect(result[0].breakdown.priceComponent).toBeGreaterThan(result[1].breakdown.priceComponent);
  });

  test('all same price gives everyone equal price scores', () => {
    const a = makeOffering({ id: 'a', priceInputPerMillion: 1.0, priceOutputPerMillion: 1.0 });
    const b = makeOffering({ id: 'b', priceInputPerMillion: 1.0, priceOutputPerMillion: 1.0 });
    const result = scoreOfferings([a, b], costProfile);
    expect(result[0].breakdown.priceComponent).toBe(result[1].breakdown.priceComponent);
  });

  test('free provider gets max price score', () => {
    const free = makeOffering({ id: 'free', priceInputPerMillion: 0, priceOutputPerMillion: 0 });
    const result = scoreOfferings([free, expensive], costProfile);
    expect(result[0].offering.id).toBe('free');
    expect(result[0].breakdown.priceComponent).toBe(1.0);
  });
});

// ═══════════════════════════════════════════════════════
// TESTS: LATENCY OPTIMIZATION
// ═══════════════════════════════════════════════════════

describe('latency optimization', () => {
  const latencyProfile: RoutingProfile = { ...DEFAULT_ROUTING_PROFILE, optimize: 'latency' };

  test('fastest provider ranks first when optimizing for latency', () => {
    const result = scoreOfferings([slowProvider, fastProvider], latencyProfile);
    expect(result[0].offering.id).toBe('fast');
  });

  test('provider with no latency data gets neutral score', () => {
    const result = scoreOfferings([newProvider], latencyProfile);
    expect(result[0].breakdown.latencyComponent).toBe(0.5);
  });

  test('provider well within tolerance scores near 1.0', () => {
    const veryFast = makeOffering({ id: 'vf', latencyP95Ms: 50 });
    const result = scoreOfferings([veryFast], { ...latencyProfile, maxLatencyMs: 5000 });
    expect(result[0].breakdown.latencyComponent).toBeGreaterThan(0.95);
  });

  test('provider way above tolerance scores near 0.0', () => {
    const verySlow = makeOffering({ id: 'vs', latencyP95Ms: 20000 });
    const result = scoreOfferings([verySlow], { ...latencyProfile, maxLatencyMs: 1000 });
    expect(result[0].breakdown.latencyComponent).toBeLessThan(0.1);
  });
});

// ═══════════════════════════════════════════════════════
// TESTS: RELIABILITY OPTIMIZATION
// ═══════════════════════════════════════════════════════

describe('reliability optimization', () => {
  const relProfile: RoutingProfile = { ...DEFAULT_ROUTING_PROFILE, optimize: 'reliability' };

  test('most reliable provider ranks first', () => {
    const result = scoreOfferings([unreliable, reliable], relProfile);
    expect(result[0].offering.id).toBe('reliable');
  });

  test('new provider with zero observations gets 0.5 reliability', () => {
    const result = scoreOfferings([newProvider], relProfile);
    expect(result[0].breakdown.reliabilityComponent).toBe(0.5);
  });
});

// ═══════════════════════════════════════════════════════
// TESTS: FILTERING
// ═══════════════════════════════════════════════════════

describe('filtering', () => {
  test('offline providers are excluded', () => {
    const result = scoreOfferings([cheap, offlineProvider]);
    expect(result).toHaveLength(1);
    expect(result[0].offering.id).toBe('cheap');
  });

  test('providers below quality threshold are excluded', () => {
    const profile: RoutingProfile = { ...DEFAULT_ROUTING_PROFILE, minQuality: 0.8 };
    const result = scoreOfferings([highQuality, lowQuality], profile);
    expect(result).toHaveLength(1);
    expect(result[0].offering.id).toBe('hq');
  });

  test('blocked providers are excluded', () => {
    const profile: RoutingProfile = { ...DEFAULT_ROUTING_PROFILE, blockedProviders: ['cheap'] };
    const result = scoreOfferings([cheap, expensive], profile);
    expect(result).toHaveLength(1);
    expect(result[0].offering.id).toBe('expensive');
  });

  test('providers above cost limit are excluded', () => {
    const profile: RoutingProfile = { ...DEFAULT_ROUTING_PROFILE, maxCostPerMillionTokens: 5.0 };
    const result = scoreOfferings([cheap, expensive], profile);
    expect(result).toHaveLength(1);
    expect(result[0].offering.id).toBe('cheap');
  });

  test('all providers excluded returns empty array', () => {
    const profile: RoutingProfile = { ...DEFAULT_ROUTING_PROFILE, minQuality: 0.99 };
    const result = scoreOfferings([lowQuality], profile);
    expect(result).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════
// TESTS: PREFERRED PROVIDERS
// ═══════════════════════════════════════════════════════

describe('preferred providers', () => {
  test('preferred provider gets a score bonus', () => {
    const profile: RoutingProfile = { ...DEFAULT_ROUTING_PROFILE, preferredProviders: ['mid'] };
    const a = makeOffering({ id: 'a', providerId: 'a', priceInputPerMillion: 1.0, priceOutputPerMillion: 1.0 });
    const b = makeOffering({ id: 'mid', providerId: 'mid', priceInputPerMillion: 1.05, priceOutputPerMillion: 1.05 });
    
    // Without preference, a should be slightly cheaper and win
    const noPreference = scoreOfferings([a, b]);
    expect(noPreference[0].offering.id).toBe('a');
    
    // With preference for mid, mid should win despite being slightly more expensive
    const withPreference = scoreOfferings([a, b], profile);
    expect(withPreference[0].offering.id).toBe('mid');
  });
});

// ═══════════════════════════════════════════════════════
// TESTS: EDGE CASES
// ═══════════════════════════════════════════════════════

describe('edge cases', () => {
  test('single provider always returns that provider', () => {
    const result = scoreOfferings([midPrice]);
    expect(result).toHaveLength(1);
    expect(result[0].score).toBeGreaterThan(0);
  });

  test('identical offerings get identical scores', () => {
    const a = makeOffering({ id: 'a' });
    const b = makeOffering({ id: 'b' });
    const result = scoreOfferings([a, b]);
    expect(result[0].score).toBe(result[1].score);
  });

  test('quality score 0 still gets scored (not excluded by default)', () => {
    const zero = makeOffering({ id: 'zero', qualityScore: 0.0 });
    const result = scoreOfferings([zero], { ...DEFAULT_ROUTING_PROFILE, minQuality: 0 });
    expect(result).toHaveLength(1);
    expect(result[0].breakdown.qualityComponent).toBe(0);
  });

  test('quality score above 1 is clamped to 1', () => {
    const high = makeOffering({ id: 'high', qualityScore: 1.5 });
    const result = scoreOfferings([high]);
    expect(result[0].breakdown.qualityComponent).toBe(1);
  });

  test('negative quality score is clamped to 0', () => {
    const neg = makeOffering({ id: 'neg', qualityScore: -0.5 });
    const result = scoreOfferings([neg], { ...DEFAULT_ROUTING_PROFILE, minQuality: 0 });
    expect(result[0].breakdown.qualityComponent).toBe(0);
  });

  test('reliability above 1 is clamped', () => {
    const high = makeOffering({ id: 'high', reliabilityScore: 1.5, observationCount: 10 });
    const result = scoreOfferings([high]);
    expect(result[0].breakdown.reliabilityComponent).toBe(1);
  });

  test('very large number of offerings still works', () => {
    const many = Array.from({ length: 500 }, (_, i) =>
      makeOffering({ id: `p${i}`, providerId: `p${i}`, priceInputPerMillion: i * 0.1, priceOutputPerMillion: i * 0.1 })
    );
    const result = scoreOfferings(many);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(500);
  });

  test('stale provider is not excluded (only offline is)', () => {
    const stale = makeOffering({ id: 'stale', status: 'stale' });
    const result = scoreOfferings([stale]);
    expect(result).toHaveLength(1);
  });

  test('degraded provider is not excluded', () => {
    const degraded = makeOffering({ id: 'degraded', status: 'degraded' });
    const result = scoreOfferings([degraded]);
    expect(result).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════
// TESTS: RECOMMENDATION GENERATION
// ═══════════════════════════════════════════════════════

describe('generateRecommendation', () => {
  test('returns null for empty offerings', () => {
    expect(generateRecommendation([])).toBeNull();
  });

  test('returns null when all are filtered out', () => {
    const profile: RoutingProfile = { ...DEFAULT_ROUTING_PROFILE, minQuality: 0.99 };
    expect(generateRecommendation([lowQuality], profile)).toBeNull();
  });

  test('returns recommended offering', () => {
    const rec = generateRecommendation([cheap, expensive]);
    expect(rec).not.toBeNull();
    expect(rec!.recommended.offering).toBeDefined();
  });

  test('includes up to 3 alternatives', () => {
    const offerings = Array.from({ length: 10 }, (_, i) =>
      makeOffering({ id: `p${i}`, providerId: `p${i}`, priceInputPerMillion: i + 1, priceOutputPerMillion: i + 1 })
    );
    const rec = generateRecommendation(offerings);
    expect(rec!.alternatives.length).toBeLessThanOrEqual(3);
  });

  test('calculates savings when current cost provided', () => {
    const rec = generateRecommendation([cheap], DEFAULT_ROUTING_PROFILE, 10.0);
    expect(rec!.savingsPercent).not.toBeNull();
    expect(rec!.savingsAbsolute).not.toBeNull();
    expect(rec!.savingsPercent!).toBeGreaterThan(0);
    expect(rec!.savingsAbsolute!).toBeGreaterThan(0);
  });

  test('savings are null when no current cost', () => {
    const rec = generateRecommendation([cheap]);
    expect(rec!.savingsPercent).toBeNull();
    expect(rec!.savingsAbsolute).toBeNull();
  });

  test('savings can be negative if current is already cheapest', () => {
    const rec = generateRecommendation([expensive], DEFAULT_ROUTING_PROFILE, 0.01);
    expect(rec!.savingsAbsolute!).toBeLessThan(0);
  });
});

// ═══════════════════════════════════════════════════════
// TESTS: PRICE COMPARISON
// ═══════════════════════════════════════════════════════

describe('comparePrices', () => {
  const offerings = [
    makeOffering({ id: 'hyp-llama', providerId: 'hyperbolic', model: 'meta-llama/Llama-3.1-70B-Instruct', modelShort: 'Llama-70B', priceInputPerMillion: 0.40, priceOutputPerMillion: 0.40 }),
    makeOffering({ id: 'oai-gpt4o', providerId: 'openai', model: 'gpt-4o', modelShort: 'GPT-4o', priceInputPerMillion: 2.50, priceOutputPerMillion: 10.00 }),
    makeOffering({ id: 'ant-sonnet', providerId: 'anthropic', model: 'claude-sonnet-4-6', modelShort: 'Sonnet 4.6', priceInputPerMillion: 3.00, priceOutputPerMillion: 15.00 }),
    makeOffering({ id: 'hyp-llama-bf16', providerId: 'hyperbolic', model: 'meta-llama/Llama-3.1-70B-Instruct', modelShort: 'Llama-70B', quantization: 'BF16', priceInputPerMillion: 0.55, priceOutputPerMillion: 0.55 }),
  ];

  test('finds offerings by model name', () => {
    const result = comparePrices(offerings, 'llama');
    expect(result.length).toBe(2);
  });

  test('finds by short name', () => {
    const result = comparePrices(offerings, 'GPT-4o');
    expect(result.length).toBe(1);
  });

  test('returns empty for unknown model', () => {
    const result = comparePrices(offerings, 'nonexistent');
    expect(result.length).toBe(0);
  });

  test('results are sorted by price ascending', () => {
    const result = comparePrices(offerings, 'llama');
    const prices = result.map(o => (o.priceInputPerMillion + o.priceOutputPerMillion) / 2);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test('case insensitive search', () => {
    const result = comparePrices(offerings, 'LLAMA');
    expect(result.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════
// TESTS: DETERMINISM
// ═══════════════════════════════════════════════════════

describe('determinism', () => {
  test('same inputs always produce same output', () => {
    const offerings = [cheap, expensive, midPrice, fastProvider, slowProvider];
    const result1 = scoreOfferings(offerings);
    const result2 = scoreOfferings(offerings);
    
    expect(result1.length).toBe(result2.length);
    for (let i = 0; i < result1.length; i++) {
      expect(result1[i].score).toBe(result2[i].score);
      expect(result1[i].offering.id).toBe(result2[i].offering.id);
    }
  });

  test('order of input offerings does not affect ranking', () => {
    const a = [cheap, expensive, midPrice];
    const b = [expensive, midPrice, cheap];
    const resultA = scoreOfferings(a);
    const resultB = scoreOfferings(b);
    
    expect(resultA.map(r => r.offering.id)).toEqual(resultB.map(r => r.offering.id));
  });
});

// ═══════════════════════════════════════════════════════
// TESTS: WEIGHT VALIDATION
// ═══════════════════════════════════════════════════════

describe('weight profiles', () => {
  const allOfferings = [cheap, expensive, fastProvider, slowProvider, highQuality, lowQuality, reliable, unreliable];

  test('cost optimization produces different ranking than latency optimization', () => {
    const costResult = scoreOfferings(allOfferings, { ...DEFAULT_ROUTING_PROFILE, optimize: 'cost' });
    const latencyResult = scoreOfferings(allOfferings, { ...DEFAULT_ROUTING_PROFILE, optimize: 'latency' });
    
    // Top result should differ (cost picks cheap, latency picks fast)
    expect(costResult[0].offering.id).not.toBe(latencyResult[0].offering.id);
  });

  test('balanced optimization considers all factors', () => {
    const result = scoreOfferings(allOfferings, { ...DEFAULT_ROUTING_PROFILE, optimize: 'balanced' });
    const bd = result[0].breakdown;
    
    // All components should be non-zero for a normal offering
    expect(bd.qualityComponent).toBeGreaterThan(0);
    expect(bd.reliabilityComponent).toBeGreaterThan(0);
    expect(bd.priceComponent).toBeGreaterThan(0);
  });
});
