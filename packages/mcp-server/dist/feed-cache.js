/**
 * Volt HQ — Pricing Feed Cache
 *
 * Local cache of the signed pricing feed with automatic refresh.
 * Fail-open: if the feed cannot be fetched, returns stale data.
 * If no data has ever been fetched, returns an empty offerings array.
 */
import { SNAPSHOT_OFFERINGS } from './snapshot.js';
const FEED_URL = 'https://feed.volthq.dev/v1/prices';
const REFRESH_INTERVAL_MS = 60_000; // 60 seconds
const CIRCUIT_BREAKER_THRESHOLD = 3; // consecutive failures before opening circuit
const CIRCUIT_BREAKER_RESET_MS = 120_000; // 2 minutes in open state before half-open
export class FeedCache {
    offerings = [];
    lastFetchedAt = 0;
    refreshTimer = null;
    // Circuit breaker state
    circuitState = 'closed';
    consecutiveFailures = 0;
    lastFailure = null;
    lastSuccess = null;
    feedUrl;
    constructor(feedUrl) {
        this.feedUrl = feedUrl ?? FEED_URL;
        // Seed with embedded snapshot so tools work before a live feed is available
        this.offerings = SNAPSHOT_OFFERINGS;
    }
    /** Start periodic background refresh. */
    start() {
        // Fetch immediately on start
        this.refresh();
        this.refreshTimer = setInterval(() => this.refresh(), REFRESH_INTERVAL_MS);
    }
    /** Stop background refresh. */
    stop() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
    /** Get current cached offerings. Never throws. */
    getOfferings() {
        return this.offerings;
    }
    /** Age of the cached feed in seconds. */
    getCacheAgeSeconds() {
        if (this.lastFetchedAt === 0)
            return Infinity;
        return Math.round((Date.now() - this.lastFetchedAt) / 1000);
    }
    /** Circuit breaker status for diagnostics. */
    getCircuitStatus() {
        return {
            state: this.circuitState,
            consecutiveFailures: this.consecutiveFailures,
            lastFailure: this.lastFailure,
            lastSuccess: this.lastSuccess,
            feedCacheAgeSeconds: this.getCacheAgeSeconds(),
        };
    }
    /** Allow injecting offerings directly (useful for testing or seeding). */
    setOfferings(offerings) {
        this.offerings = offerings;
        this.lastFetchedAt = Date.now();
    }
    /** Attempt to refresh the feed. Fail-open: never throws. */
    async refresh() {
        // Circuit breaker: skip fetch if circuit is open
        if (this.circuitState === 'open') {
            const elapsed = Date.now() - (this.lastFailure ? new Date(this.lastFailure).getTime() : 0);
            if (elapsed < CIRCUIT_BREAKER_RESET_MS)
                return;
            // Transition to half-open to test
            this.circuitState = 'half-open';
        }
        try {
            const response = await fetch(this.feedUrl, {
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(10_000),
            });
            if (!response.ok) {
                this.recordFailure();
                return;
            }
            const feed = (await response.json());
            if (!feed.offerings || !Array.isArray(feed.offerings)) {
                this.recordFailure();
                return;
            }
            this.offerings = feed.offerings;
            this.lastFetchedAt = Date.now();
            this.consecutiveFailures = 0;
            this.circuitState = 'closed';
            this.lastSuccess = new Date().toISOString();
        }
        catch {
            // Fail-open: keep stale data, log nothing destructive
            this.recordFailure();
        }
    }
    recordFailure() {
        this.consecutiveFailures++;
        this.lastFailure = new Date().toISOString();
        if (this.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
            this.circuitState = 'open';
        }
    }
}
//# sourceMappingURL=feed-cache.js.map