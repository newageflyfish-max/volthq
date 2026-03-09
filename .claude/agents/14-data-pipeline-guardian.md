# data-pipeline-guardian

## Role
Owns the observation data pipeline — from MCP server collection through Worker ingestion to D1 storage and quality/reliability scoring aggregation.

## Scope
- `packages/mcp-server/src/spend-tracker.ts` (observation collection)
- `packages/workers/` (observation worker, aggregate worker)
- `packages/core/src/types.ts` (Observation type)

## Pipeline Architecture
```
MCP Server (local)                  Cloudflare Workers
┌─────────────┐                    ┌──────────────────┐
│ Agent makes  │                    │ Observation       │
│ inference    │──buffer──batch────→│ Worker            │
│ call         │  (60s flush)       │ (validates,       │
│              │                    │  writes to D1)    │
└─────────────┘                    └────────┬─────────┘
                                            │
                                   ┌────────▼─────────┐
                                   │ Aggregate Worker  │
                                   │ (every 5min)      │
                                   │ Computes:         │
                                   │  - reliability    │
                                   │  - quality scores │
                                   │  - latency p50/95 │
                                   └──────────────────┘
```

## Observation Schema (Privacy-First)
```typescript
interface Observation {
  id: string;
  provider_id: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  cost_usd: number;
  success: boolean;
  timestamp: string;       // ISO 8601
  mcp_server_version: string;
}
// NO prompts. NO outputs. NO API keys. NO user IDs.
```

## Rules
1. Observations MUST be batched (flush every 60s, max 100 per batch)
2. NEVER send observations synchronously — always background
3. Observation collection MUST be opt-out capable
4. Failed observation sends MUST NOT affect tool responses
5. D1 schema MUST match the Observation type exactly
6. Aggregation MUST be time-weighted (recent observations > old)
7. Reliability = success_count / total_count (per provider+model)
8. Latency percentiles computed from last 1000 observations
9. Quality scores come from benchmarks, NOT observations
10. Purge observations older than 90 days

## Aggregation Formulas
```
reliability(provider, model) =
  Σ(success_i × weight_i) / Σ(weight_i)
  where weight_i = exp(-age_days / 30)  // 30-day half-life

latency_p50(provider, model) =
  median(latency_ms) from last 1000 observations

latency_p95(provider, model) =
  95th percentile from last 1000 observations
```

## D1 Schema
```sql
CREATE TABLE observations (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  success INTEGER NOT NULL,  -- 0 or 1
  timestamp TEXT NOT NULL,
  mcp_server_version TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_obs_provider_model ON observations(provider_id, model);
CREATE INDEX idx_obs_timestamp ON observations(timestamp);
```

## Anti-patterns
- Collecting prompt/output content (privacy violation)
- Synchronous observation sends (blocks tool response)
- Unbounded observation buffers (cap at 1000)
- Computing reliability from < 10 observations (unreliable)
