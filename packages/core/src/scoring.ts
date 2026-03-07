/**
 * Volt HQ — Scoring Algorithm
 * 
 * The routing decision engine. Given a set of offerings and agent preferences,
 * returns a ranked list of providers with composite scores.
 * 
 * This is the most critical code in the entire system.
 * Pure functions. No I/O. No side effects. Deterministic given inputs.
 */

import {
  Offering,
  RoutingProfile,
  ScoredOffering,
  ScoreBreakdown,
  RoutingRecommendation,
  DEFAULT_ROUTING_PROFILE,
} from './types.js';

// ═══════════════════════════════════════════════════════
// SCORING WEIGHTS BY OPTIMIZATION TARGET
// ═══════════════════════════════════════════════════════

interface ScoringWeights {
  quality: number;
  reliability: number;
  latency: number;
  price: number;
}

const WEIGHTS: Record<string, ScoringWeights> = {
  cost:        { quality: 0.15, reliability: 0.15, latency: 0.10, price: 0.60 },
  latency:     { quality: 0.15, reliability: 0.20, latency: 0.50, price: 0.15 },
  reliability: { quality: 0.15, reliability: 0.55, latency: 0.15, price: 0.15 },
  balanced:    { quality: 0.25, reliability: 0.25, latency: 0.25, price: 0.25 },
};

// ═══════════════════════════════════════════════════════
// COMPONENT SCORING FUNCTIONS
// ═══════════════════════════════════════════════════════

/**
 * Quality component: direct pass-through of benchmark quality score.
 * BF16 reference model = 1.0, FP8 ≈ 0.97, INT4 ≈ 0.89
 */
function scoreQuality(offering: Offering): number {
  return Math.max(0, Math.min(1, offering.qualityScore));
}

/**
 * Reliability component: time-weighted success rate from observations.
 * New providers with no observations get 0.5 (neutral, not punished but not trusted).
 */
function scoreReliability(offering: Offering): number {
  if (offering.observationCount === 0) return 0.5;
  return Math.max(0, Math.min(1, offering.reliabilityScore));
}

/**
 * Latency fit: how well the provider's latency matches the agent's tolerance.
 * 
 * Uses a sigmoid-like curve:
 * - Provider latency well within tolerance → score near 1.0
 * - Provider latency at tolerance boundary → score ≈ 0.5
 * - Provider latency well above tolerance → score near 0.0
 * 
 * If provider has no latency data, returns 0.5 (neutral).
 */
function scoreLatency(offering: Offering, maxLatencyMs: number): number {
  if (offering.latencyP95Ms === null) return 0.5;
  
  const ratio = offering.latencyP95Ms / maxLatencyMs;
  
  // Sigmoid centered at ratio=1.0 (boundary of tolerance)
  // ratio < 0.5: score ≈ 1.0 (well within tolerance)
  // ratio = 1.0: score ≈ 0.5 (at boundary)
  // ratio > 2.0: score ≈ 0.0 (well above tolerance)
  const score = 1 / (1 + Math.exp(5 * (ratio - 1)));
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Price component: inverted normalized price.
 * Cheapest provider scores 1.0. Most expensive scores close to 0.
 * 
 * Uses the average of input and output token prices as the comparison metric.
 * If all providers have the same price, everyone scores 1.0.
 */
function scorePrice(offering: Offering, maxPrice: number, minPrice: number): number {
  const price = (offering.priceInputPerMillion + offering.priceOutputPerMillion) / 2;
  
  if (maxPrice === minPrice) return 1.0; // all same price
  if (price <= 0) return 1.0; // free
  
  // Linear normalization: cheapest = 1.0, most expensive = 0.1 (not 0, so expensive providers aren't invisible)
  const normalized = 1 - 0.9 * ((price - minPrice) / (maxPrice - minPrice));
  
  return Math.max(0.1, Math.min(1, normalized));
}

// ═══════════════════════════════════════════════════════
// FILTERING
// ═══════════════════════════════════════════════════════

/**
 * Filter offerings based on agent's hard constraints.
 * Returns only offerings that meet minimum requirements.
 */
function filterOfferings(offerings: Offering[], profile: RoutingProfile): Offering[] {
  return offerings.filter(o => {
    // Must be active
    if (o.status === 'offline') return false;
    
    // Must meet minimum quality
    if (o.qualityScore < profile.minQuality) return false;
    
    // Must not be blocked
    if (profile.blockedProviders.includes(o.providerId)) return false;
    
    // Must be within cost limit (if set)
    if (profile.maxCostPerMillionTokens !== Infinity) {
      const avgPrice = (o.priceInputPerMillion + o.priceOutputPerMillion) / 2;
      if (avgPrice > profile.maxCostPerMillionTokens) return false;
    }
    
    return true;
  });
}

// ═══════════════════════════════════════════════════════
// MAIN SCORING FUNCTION
// ═══════════════════════════════════════════════════════

/**
 * Score and rank all offerings for a given routing profile.
 * 
 * Returns offerings sorted by composite score (highest first).
 * Pure function: deterministic given inputs.
 */
export function scoreOfferings(
  offerings: Offering[],
  profile: RoutingProfile = DEFAULT_ROUTING_PROFILE
): ScoredOffering[] {
  // Step 1: Filter by hard constraints
  const eligible = filterOfferings(offerings, profile);
  
  if (eligible.length === 0) return [];
  
  // Step 2: Compute price range for normalization
  const prices = eligible.map(o => (o.priceInputPerMillion + o.priceOutputPerMillion) / 2);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  
  // Step 3: Get weights for the optimization target
  const weights = WEIGHTS[profile.optimize] || WEIGHTS.balanced;
  
  // Step 4: Score each offering
  const scored: ScoredOffering[] = eligible.map(offering => {
    const qualityComponent = scoreQuality(offering);
    const reliabilityComponent = scoreReliability(offering);
    const latencyComponent = scoreLatency(offering, profile.maxLatencyMs);
    const priceComponent = scorePrice(offering, maxPrice, minPrice);
    
    // Weighted composite score
    const score = 
      weights.quality * qualityComponent +
      weights.reliability * reliabilityComponent +
      weights.latency * latencyComponent +
      weights.price * priceComponent;
    
    // Preferred provider bonus: +10% to score
    const preferredBonus = profile.preferredProviders.includes(offering.providerId) ? 0.1 : 0;
    
    return {
      offering,
      score: Math.min(1, score + preferredBonus),
      breakdown: {
        qualityComponent,
        reliabilityComponent,
        latencyComponent,
        priceComponent,
      },
    };
  });
  
  // Step 5: Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  return scored;
}

/**
 * Generate a full routing recommendation.
 * 
 * Takes the scored offerings and the agent's current provider cost (if known)
 * to produce an actionable recommendation with savings estimate.
 */
export function generateRecommendation(
  offerings: Offering[],
  profile: RoutingProfile = DEFAULT_ROUTING_PROFILE,
  currentCostPerMillion: number | null = null
): RoutingRecommendation | null {
  const scored = scoreOfferings(offerings, profile);
  
  if (scored.length === 0) return null;
  
  const recommended = scored[0];
  const alternatives = scored.slice(1, 4); // top 3 alternatives
  
  const recommendedCost = (
    recommended.offering.priceInputPerMillion + 
    recommended.offering.priceOutputPerMillion
  ) / 2;
  
  let savingsPercent: number | null = null;
  let savingsAbsolute: number | null = null;
  
  if (currentCostPerMillion !== null && currentCostPerMillion > 0) {
    savingsAbsolute = currentCostPerMillion - recommendedCost;
    savingsPercent = (savingsAbsolute / currentCostPerMillion) * 100;
  }
  
  return {
    recommended,
    alternatives,
    currentCost: currentCostPerMillion,
    recommendedCost,
    savingsPercent: savingsPercent !== null ? Math.round(savingsPercent * 10) / 10 : null,
    savingsAbsolute: savingsAbsolute !== null ? Math.round(savingsAbsolute * 100) / 100 : null,
  };
}

/**
 * Quick price comparison for a specific model across all providers.
 * Returns offerings sorted by price (cheapest first).
 */
export function comparePrices(
  offerings: Offering[],
  modelQuery: string
): Offering[] {
  const matching = offerings.filter(o => {
    const query = modelQuery.toLowerCase();
    return (
      o.model.toLowerCase().includes(query) ||
      o.modelShort.toLowerCase().includes(query)
    );
  });
  
  matching.sort((a, b) => {
    const priceA = (a.priceInputPerMillion + a.priceOutputPerMillion) / 2;
    const priceB = (b.priceInputPerMillion + b.priceOutputPerMillion) / 2;
    return priceA - priceB;
  });
  
  return matching;
}
