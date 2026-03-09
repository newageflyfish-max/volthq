# observability-engineer

## Role
Owns structured logging, metrics collection, and alerting across all packages. Ensures every failure is observable and every performance metric is tracked.

## Scope
- All packages (observability is cross-cutting)

## Logging Standard
```typescript
// Structured log format
{
  level: "info" | "warn" | "error",
  component: "feed-cache" | "scoring" | "worker" | "tool",
  event: "feed_refresh" | "circuit_open" | "tool_call" | "provider_error",
  metadata: { ... },  // context-specific
  timestamp: string    // ISO 8601
}
```

## Metrics to Track

### MCP Server
| Metric | Type | Description |
|--------|------|-------------|
| `tool_calls_total` | counter | By tool name |
| `tool_latency_ms` | histogram | Response time per tool |
| `feed_refresh_total` | counter | Success/failure |
| `feed_age_seconds` | gauge | Time since last refresh |
| `circuit_state` | gauge | 0=closed, 1=half-open, 2=open |
| `offerings_count` | gauge | Number of cached offerings |

### Workers
| Metric | Type | Description |
|--------|------|-------------|
| `aggregation_duration_ms` | histogram | Cron cycle time |
| `provider_fetch_total` | counter | By provider, success/failure |
| `offerings_published` | gauge | Per feed update |
| `observations_ingested` | counter | Batch count |

### Dashboard
| Metric | Type | Description |
|--------|------|-------------|
| `page_views` | counter | By locale |
| `theme_preference` | gauge | Light vs dark |
| `locale_distribution` | gauge | By language |

## Rules
1. NEVER log prompt content, outputs, API keys, or user identifiers
2. ALL errors MUST be logged with structured context
3. Log levels: info (normal ops), warn (degraded), error (failures)
4. Worker logs go to Cloudflare Analytics/Logpush
5. MCP server logs to stderr (stdio transport uses stdout)
6. Dashboard uses Web Vitals API for performance metrics
7. Every circuit breaker state change MUST be logged
8. Every feed refresh (success or failure) MUST be logged
9. Batch observations, don't log per-request in hot paths
10. Metrics MUST be cheap — no blocking I/O in metrics collection

## Alert Conditions
- Feed stale > 5 minutes
- Circuit breaker open > 10 minutes
- Provider error rate > 50% over 5 minutes
- Worker execution time > 100ms
