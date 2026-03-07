/**
 * Volt HQ — Pricing Feed Cache
 *
 * Local cache of the signed pricing feed with automatic refresh.
 * Fail-open: if the feed cannot be fetched, returns stale data.
 * If no data has ever been fetched, returns an empty offerings array.
 */
import type { Offering, CircuitBreakerStatus } from '@volthq/core';
export declare class FeedCache {
    private offerings;
    private lastFetchedAt;
    private refreshTimer;
    private circuitState;
    private consecutiveFailures;
    private lastFailure;
    private lastSuccess;
    private feedUrl;
    constructor(feedUrl?: string);
    /** Start periodic background refresh. */
    start(): void;
    /** Stop background refresh. */
    stop(): void;
    /** Get current cached offerings. Never throws. */
    getOfferings(): Offering[];
    /** Age of the cached feed in seconds. */
    getCacheAgeSeconds(): number;
    /** Circuit breaker status for diagnostics. */
    getCircuitStatus(): CircuitBreakerStatus;
    /** Allow injecting offerings directly (useful for testing or seeding). */
    setOfferings(offerings: Offering[]): void;
    /** Attempt to refresh the feed. Fail-open: never throws. */
    private refresh;
    private recordFailure;
}
//# sourceMappingURL=feed-cache.d.ts.map