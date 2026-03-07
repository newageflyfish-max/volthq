/**
 * Volt HQ — Scoring Algorithm
 *
 * The routing decision engine. Given a set of offerings and agent preferences,
 * returns a ranked list of providers with composite scores.
 *
 * This is the most critical code in the entire system.
 * Pure functions. No I/O. No side effects. Deterministic given inputs.
 */
import { Offering, RoutingProfile, ScoredOffering, RoutingRecommendation } from './types.js';
/**
 * Score and rank all offerings for a given routing profile.
 *
 * Returns offerings sorted by composite score (highest first).
 * Pure function: deterministic given inputs.
 */
export declare function scoreOfferings(offerings: Offering[], profile?: RoutingProfile): ScoredOffering[];
/**
 * Generate a full routing recommendation.
 *
 * Takes the scored offerings and the agent's current provider cost (if known)
 * to produce an actionable recommendation with savings estimate.
 */
export declare function generateRecommendation(offerings: Offering[], profile?: RoutingProfile, currentCostPerMillion?: number | null): RoutingRecommendation | null;
/**
 * Quick price comparison for a specific model across all providers.
 * Returns offerings sorted by price (cheapest first).
 */
export declare function comparePrices(offerings: Offering[], modelQuery: string): Offering[];
//# sourceMappingURL=scoring.d.ts.map