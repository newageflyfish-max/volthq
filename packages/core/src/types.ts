/**
 * Volt HQ — Core Types
 * 
 * These types define every data structure in the system.
 * All other packages import from here. Nothing is duplicated.
 */

// ═══════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════

export type ProviderType = 'centralized' | 'depin';
export type ProviderStatus = 'active' | 'degraded' | 'stale' | 'offline';
export type PricingModel = 'per-token' | 'per-hour' | 'per-request';

export interface Provider {
  id: string;                    // e.g., "hyperbolic", "akash", "openai"
  name: string;                  // e.g., "Hyperbolic"
  type: ProviderType;
  pricingModel: PricingModel;
  apiEndpoint: string | null;    // null for manually-priced providers
  status: ProviderStatus;
  lastPolled: string | null;     // ISO 8601
}

// ═══════════════════════════════════════════════════════
// OFFERING — the atomic unit
// provider + model + quantization + GPU + region = one offering
// ═══════════════════════════════════════════════════════

export interface Offering {
  id: string;                           // deterministic: `${providerId}:${model}:${quantization}:${gpuType}:${region}`
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  
  // Model details
  model: string;                        // e.g., "meta-llama/Llama-3.1-70B-Instruct"
  modelShort: string;                   // e.g., "Llama-70B"
  capabilityTier: 1 | 2 | 3 | 4 | 5;  // 1 = highest (GPT-4 class), 5 = lowest
  quantization: string | null;          // e.g., "BF16", "FP8", "INT4"
  gpuType: string | null;              // e.g., "H100-SXM", "A100-80GB"
  region: string;                       // e.g., "us-east", "global"
  
  // Pricing (all in USD)
  priceInputPerMillion: number;         // USD per 1M input tokens
  priceOutputPerMillion: number;        // USD per 1M output tokens
  pricePerGpuHour: number | null;      // USD per GPU-hour (DePIN only)
  
  // Quality signals
  qualityScore: number;                 // 0-1, from benchmarks
  reliabilityScore: number;            // 0-1, from observations (default 0.5 for new)
  latencyP50Ms: number | null;         // median latency in ms
  latencyP95Ms: number | null;         // 95th percentile latency in ms
  
  // Metadata
  observationCount: number;            // total observations backing the scores
  status: ProviderStatus;
  lastPriceUpdate: string;             // ISO 8601
  lastObservationUpdate: string | null;
  dataSource: 'api' | 'benchmark' | 'manual'; // how we got this data
}

// ═══════════════════════════════════════════════════════
// PRICING FEED — what gets published via CDN
// ═══════════════════════════════════════════════════════

export interface PricingFeed {
  version: 1;
  timestamp: string;             // ISO 8601
  signature: string;             // Ed25519 signature of (timestamp + JSON(offerings))
  offeringCount: number;
  offerings: Offering[];
}

export interface PricingFeedPublic {
  version: 1;
  timestamp: string;
  signature: string;
  offeringCount: number;
  offerings: PublicOffering[];    // stripped of quality/reliability data
}

export type PublicOffering = Pick<Offering, 
  'id' | 'providerId' | 'providerName' | 'providerType' |
  'model' | 'modelShort' | 'capabilityTier' | 'quantization' | 'gpuType' | 'region' |
  'priceInputPerMillion' | 'priceOutputPerMillion' | 'pricePerGpuHour' |
  'status' | 'lastPriceUpdate' | 'dataSource'
>;

// ═══════════════════════════════════════════════════════
// OBSERVATION — what agents report back
// Privacy by schema: NO fields for prompts, outputs, or API keys
// ═══════════════════════════════════════════════════════

export interface Observation {
  agentId: string;              // anonymous, MCP-server-generated UUID
  offeringId: string;           // which offering was used
  timestamp: string;            // ISO 8601
  tokensInput: number;
  tokensOutput: number;
  latencyTtftMs: number;        // time to first token
  latencyTotalMs: number;       // total response time
  costCharged: number;          // USD
  success: boolean;
  errorType: string | null;     // e.g., "timeout", "rate_limit", "server_error"
  wasRetry: boolean;            // did the agent retry after this call?
}

export interface ObservationBatch {
  agentId: string;
  apiKey: string;               // contributor API key
  observations: Observation[];
}

// ═══════════════════════════════════════════════════════
// ROUTING — the decision engine inputs/outputs
// ═══════════════════════════════════════════════════════

export type OptimizeTarget = 'cost' | 'latency' | 'reliability' | 'balanced';

export interface RoutingProfile {
  optimize: OptimizeTarget;
  minQuality: number;           // 0-1, default 0.7
  maxLatencyMs: number;         // default 5000
  maxCostPerMillionTokens: number; // default Infinity (no limit)
  preferredProviders: string[]; // provider IDs to prefer
  blockedProviders: string[];   // provider IDs to exclude
}

export const DEFAULT_ROUTING_PROFILE: RoutingProfile = {
  optimize: 'balanced',
  minQuality: 0.7,
  maxLatencyMs: 5000,
  maxCostPerMillionTokens: Infinity,
  preferredProviders: [],
  blockedProviders: [],
};

export interface RoutingRecommendation {
  recommended: ScoredOffering;
  alternatives: ScoredOffering[];
  currentCost: number | null;    // what the agent is paying now (if known)
  recommendedCost: number;       // what they'd pay with the recommendation
  savingsPercent: number | null;  // percentage savings
  savingsAbsolute: number | null; // dollar savings per million tokens
}

export interface ScoredOffering {
  offering: Offering;
  score: number;                 // composite score from routing algorithm
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  qualityComponent: number;
  reliabilityComponent: number;
  latencyComponent: number;
  priceComponent: number;
}

// ═══════════════════════════════════════════════════════
// SPEND TRACKING — local to MCP server
// ═══════════════════════════════════════════════════════

export interface SpendRecord {
  timestamp: string;
  providerId: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  cost: number;                  // USD
  latencyMs: number;
  success: boolean;
}

export interface SpendSummary {
  timeRange: string;             // e.g., "today", "7d", "30d"
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
  actualSpend: number;           // what the agent actually spent
  optimalSpend: number;          // what they would have spent following all recommendations
  savingsAchieved: number;       // savings from recommendations they DID follow
  savingsMissed: number;         // savings from recommendations they DIDN'T follow
  savingsPercent: number;        // overall percentage
}

// ═══════════════════════════════════════════════════════
// BUDGET ALERTS
// ═══════════════════════════════════════════════════════

export interface BudgetAlert {
  id: string;
  threshold: number;             // USD
  period: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
}

export interface BudgetAlertTriggered {
  alert: BudgetAlert;
  currentSpend: number;
  percentOfBudget: number;
  message: string;
}

// ═══════════════════════════════════════════════════════
// PROVIDER ADAPTER INTERFACE
// Each provider implements this to plug into the aggregation service
// ═══════════════════════════════════════════════════════

export interface ProviderAdapter {
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  
  /** Fetch current offerings from this provider */
  getOfferings(): Promise<Offering[]>;
  
  /** Health check — is the provider API responding? */
  healthCheck(): Promise<boolean>;
}

// ═══════════════════════════════════════════════════════
// CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerStatus {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailure: string | null;    // ISO 8601
  lastSuccess: string | null;
  feedCacheAgeSeconds: number;
}
