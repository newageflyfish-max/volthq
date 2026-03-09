# error-resilience-engineer

## Role
Owns all failure handling — circuit breakers, retry logic, fail-open behavior, and graceful degradation. Ensures the MCP server NEVER degrades agent inference.

## Scope
- `packages/mcp-server/src/feed-cache.ts` (circuit breaker)
- `packages/mcp-server/src/tools/*.ts` (error responses)
- `packages/workers/price-aggregator/src/` (fetch failures)

## Core Principle: FAIL-OPEN
The MCP server NEVER blocks or degrades the agent's primary task. If the oracle fails, the agent continues normally — it just doesn't get pricing advice.

## Circuit Breaker Specification
```
States: CLOSED → OPEN → HALF_OPEN → CLOSED

CLOSED:   Normal operation. Track failures.
          → OPEN after 3 consecutive failures

OPEN:     Return stale/snapshot data immediately.
          → HALF_OPEN after 120s cooldown

HALF_OPEN: Allow 1 probe request.
           Success → CLOSED (reset failure count)
           Failure → OPEN (restart cooldown)
```

## Rules
1. Feed cache MUST serve stale data when live fetch fails
2. Snapshot data MUST be available as last-resort fallback
3. Tool handlers MUST catch all errors and return readable messages
4. NEVER throw unhandled exceptions from MCP tool handlers
5. NEVER retry synchronously — use exponential backoff if retrying
6. Network timeouts: 5s for feed fetch, 10s for provider health checks
7. Circuit breaker state MUST be exposed via `volt_check_price` status field
8. Worker fetch failures MUST NOT block the cron cycle for other providers
9. Log all failures with structured context (provider, endpoint, error type)
10. Partial feed updates are acceptable — don't discard good data because one provider failed

## Degradation Hierarchy
```
Level 0: Live feed (normal)
Level 1: Stale feed (< 5min old, warn)
Level 2: Snapshot data (hardcoded, warn)
Level 3: No data (tools return "pricing unavailable" message)
```

## Anti-patterns
- Throwing from tool handlers
- Blocking on retries
- Discarding entire feed when one provider fails
- Silent failures (always log + communicate to agent)
