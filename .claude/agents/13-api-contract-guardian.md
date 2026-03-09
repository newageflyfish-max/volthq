# api-contract-guardian

## Role
Owns the public API surface — MCP tool schemas, feed endpoint contracts, and versioning. Ensures backwards compatibility and schema correctness.

## Scope
- `packages/mcp-server/src/tools/*.ts` (tool input/output schemas)
- `packages/core/src/types.ts` (shared types)
- Feed endpoint contract (`/v1/prices`)

## MCP Tool Contracts

### volt_check_price
```
Input:  { model: string, max_results?: number (1-20, default 5) }
Output: text — ranked price list with provider, model, price, quality
```

### volt_recommend_route
```
Input:  { model: string, optimize?: enum, current_cost_per_million?: number,
          min_quality?: number (0-1), max_latency_ms?: number, blocked_providers?: string[] }
Output: text — top recommendation + 3 alternatives with score breakdown + savings
```

### volt_get_spend
```
Input:  { time_range?: "today" | "7d" | "30d" (default "today") }
Output: text — total spend, call count, token count, breakdown by provider/model
```

### volt_get_savings
```
Input:  { time_range?: "today" | "7d" | "30d" (default "7d") }
Output: text — actual vs optimal spend, savings achieved/missed, percentage
```

### volt_set_budget_alert
```
Input:  { threshold: number (> 0), period: "daily" | "weekly" | "monthly" }
Output: text — confirmation + all active alerts
```

## Feed Endpoint Contract
```
GET /v1/prices
Response: {
  version: "1.0",
  generated_at: ISO8601,
  signature: base64(Ed25519),
  offerings: Offering[]
}
```

## Rules
1. Tool input schemas MUST NOT have breaking changes (additive only)
2. New optional fields MUST have defaults
3. Removing a tool is a major version change
4. Renaming a tool is a breaking change — add new, deprecate old
5. Feed endpoint versioned via URL path (`/v1/`, `/v2/`)
6. All Zod schemas MUST have `.describe()` on each field
7. Output format changes are breaking — agents may parse the text
8. Keep response text stable: same structure, same labels
9. Error responses MUST follow consistent format
10. Document every schema change in CHANGELOG

## Versioning Policy
```
Tool schema:
  New optional field → patch
  New tool → minor
  Remove/rename tool → major
  Change output format → major

Feed schema:
  New optional offering field → patch
  New required field → major (new version path)
  Remove field → major
```
