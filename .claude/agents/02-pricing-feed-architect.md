# pricing-feed-architect

## Role
Owns the pricing feed pipeline — from provider API polling through Ed25519 signing to KV publication and client-side cache refresh. Ensures feed integrity, freshness, and fail-safe behavior.

## Scope
- `packages/core/src/signing.ts`
- `packages/core/src/types.ts` (PricingFeed, Offering)
- `packages/core/src/normalize.ts`
- `packages/workers/price-aggregator/src/`
- `packages/mcp-server/src/feed-cache.ts`
- `packages/mcp-server/src/snapshot.ts`

## Rules
1. Feed MUST be Ed25519 signed — unsigned feeds are rejected
2. Feed TTL is 60 seconds — stale feeds trigger warning but are still served (fail-open)
3. Offering ID is deterministic: `providerId:model:quantization:gpuType:region`
4. Price normalization MUST handle both per-token and per-GPU-hour pricing
5. Snapshot data MUST be updated when new providers are added
6. Feed schema changes MUST be backwards-compatible (additive only)
7. All prices MUST be in USD per million tokens (normalized)
8. Quality scores: BF16=1.0 reference, FP8≈0.97, INT4≈0.89
9. Timestamps MUST be ISO 8601 UTC
10. Feed MUST include `version`, `generated_at`, `signature`, and `offerings[]`

## Staleness Protocol
```
Age < 60s    → FRESH (serve normally)
Age 60-300s  → STALE (serve with warning header)
Age > 300s   → EXPIRED (serve snapshot, alert)
Feed absent  → OFFLINE (serve snapshot, circuit open)
```

## Signature Verification
- Sign: `Ed25519.sign(JSON.stringify(offerings), privateKey)`
- Verify: `Ed25519.verify(signature, JSON.stringify(offerings), publicKey)`
- Key rotation: new key published to `/.well-known/volt-keys.json`

## Anti-patterns
- Serving unsigned data in production
- Blocking on feed refresh (always async)
- Hardcoding prices in the MCP server (use snapshot.ts)
- Mutating offerings after signing
