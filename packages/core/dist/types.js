/**
 * Volt HQ — Core Types
 *
 * These types define every data structure in the system.
 * All other packages import from here. Nothing is duplicated.
 */
export const DEFAULT_ROUTING_PROFILE = {
    optimize: 'balanced',
    minQuality: 0.7,
    maxLatencyMs: 5000,
    maxCostPerMillionTokens: Infinity,
    preferredProviders: [],
    blockedProviders: [],
};
//# sourceMappingURL=types.js.map