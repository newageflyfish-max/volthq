/**
 * Volt HQ — Core Types
 *
 * These types define every data structure in the system.
 * All other packages import from here. Nothing is duplicated.
 */
export type ProviderType = 'centralized' | 'depin';
export type ProviderStatus = 'active' | 'degraded' | 'stale' | 'offline';
export type PricingModel = 'per-token' | 'per-hour' | 'per-request';
export interface Provider {
    id: string;
    name: string;
    type: ProviderType;
    pricingModel: PricingModel;
    apiEndpoint: string | null;
    status: ProviderStatus;
    lastPolled: string | null;
}
export interface Offering {
    id: string;
    providerId: string;
    providerName: string;
    providerType: ProviderType;
    model: string;
    modelShort: string;
    capabilityTier: 1 | 2 | 3 | 4 | 5;
    quantization: string | null;
    gpuType: string | null;
    region: string;
    priceInputPerMillion: number;
    priceOutputPerMillion: number;
    pricePerGpuHour: number | null;
    qualityScore: number;
    reliabilityScore: number;
    latencyP50Ms: number | null;
    latencyP95Ms: number | null;
    observationCount: number;
    status: ProviderStatus;
    lastPriceUpdate: string;
    lastObservationUpdate: string | null;
    dataSource: 'api' | 'benchmark' | 'manual';
}
export interface PricingFeed {
    version: 1;
    timestamp: string;
    signature: string;
    offeringCount: number;
    offerings: Offering[];
}
export interface PricingFeedPublic {
    version: 1;
    timestamp: string;
    signature: string;
    offeringCount: number;
    offerings: PublicOffering[];
}
export type PublicOffering = Pick<Offering, 'id' | 'providerId' | 'providerName' | 'providerType' | 'model' | 'modelShort' | 'capabilityTier' | 'quantization' | 'gpuType' | 'region' | 'priceInputPerMillion' | 'priceOutputPerMillion' | 'pricePerGpuHour' | 'status' | 'lastPriceUpdate' | 'dataSource'>;
export interface Observation {
    agentId: string;
    offeringId: string;
    timestamp: string;
    tokensInput: number;
    tokensOutput: number;
    latencyTtftMs: number;
    latencyTotalMs: number;
    costCharged: number;
    success: boolean;
    errorType: string | null;
    wasRetry: boolean;
}
export interface ObservationBatch {
    agentId: string;
    apiKey: string;
    observations: Observation[];
}
export type OptimizeTarget = 'cost' | 'latency' | 'reliability' | 'balanced';
export interface RoutingProfile {
    optimize: OptimizeTarget;
    minQuality: number;
    maxLatencyMs: number;
    maxCostPerMillionTokens: number;
    preferredProviders: string[];
    blockedProviders: string[];
}
export declare const DEFAULT_ROUTING_PROFILE: RoutingProfile;
export interface RoutingRecommendation {
    recommended: ScoredOffering;
    alternatives: ScoredOffering[];
    currentCost: number | null;
    recommendedCost: number;
    savingsPercent: number | null;
    savingsAbsolute: number | null;
}
export interface ScoredOffering {
    offering: Offering;
    score: number;
    breakdown: ScoreBreakdown;
}
export interface ScoreBreakdown {
    qualityComponent: number;
    reliabilityComponent: number;
    latencyComponent: number;
    priceComponent: number;
}
export interface SpendRecord {
    timestamp: string;
    providerId: string;
    model: string;
    tokensInput: number;
    tokensOutput: number;
    cost: number;
    latencyMs: number;
    success: boolean;
}
export interface SpendSummary {
    timeRange: string;
    totalSpend: number;
    totalCalls: number;
    totalTokensInput: number;
    totalTokensOutput: number;
    byProvider: Record<string, number>;
    byModel: Record<string, number>;
    averageCostPerCall: number;
}
export interface SavingsReport {
    timeRange: string;
    actualSpend: number;
    optimalSpend: number;
    savingsAchieved: number;
    savingsMissed: number;
    savingsPercent: number;
}
export interface BudgetAlert {
    id: string;
    threshold: number;
    period: 'daily' | 'weekly' | 'monthly';
    enabled: boolean;
}
export interface BudgetAlertTriggered {
    alert: BudgetAlert;
    currentSpend: number;
    percentOfBudget: number;
    message: string;
}
export interface ProviderAdapter {
    providerId: string;
    providerName: string;
    providerType: ProviderType;
    /** Fetch current offerings from this provider */
    getOfferings(): Promise<Offering[]>;
    /** Health check — is the provider API responding? */
    healthCheck(): Promise<boolean>;
}
export type CircuitState = 'closed' | 'open' | 'half-open';
export interface CircuitBreakerStatus {
    state: CircuitState;
    consecutiveFailures: number;
    lastFailure: string | null;
    lastSuccess: string | null;
    feedCacheAgeSeconds: number;
}
//# sourceMappingURL=types.d.ts.map