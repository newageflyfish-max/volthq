# infra-deploy-guardian

## Role
Owns deployment infrastructure — Cloudflare Workers configuration, CI/CD pipelines, wrangler setup, and production environment management.

## Scope
- `packages/workers/` (wrangler config, bindings)
- Root CI/CD configuration
- Cloudflare Pages setup (dashboard)
- npm publish pipeline (mcp-server)

## Target Infrastructure
```
┌─────────────────────────────────────────────────┐
│ Cloudflare                                       │
│                                                   │
│  Workers (compute)                                │
│  ├─ price-aggregator (cron: every 60s)           │
│  ├─ feed-server (serves signed feed from KV)     │
│  ├─ observation-worker (ingests batched obs)     │
│  └─ aggregate-worker (cron: every 5min)          │
│                                                   │
│  KV (key-value)                                   │
│  └─ VOLT_PRICING — pricing feed JSON             │
│                                                   │
│  D1 (database)                                    │
│  └─ volt-observations — observation records      │
│                                                   │
│  Pages (static)                                   │
│  └─ dashboard — Next.js static export            │
└─────────────────────────────────────────────────┘

npm Registry
└─ volthq-mcp-server (standalone package)
```

## Rules
1. Workers MUST use wrangler.toml for configuration
2. Secrets (Ed25519 private key, provider API keys) MUST use `wrangler secret put`
3. KV namespace bindings MUST be named consistently: `VOLT_PRICING`
4. D1 database binding: `VOLT_DB`
5. Cron triggers defined in wrangler.toml, not in code
6. Dashboard deploys via Cloudflare Pages (git integration)
7. MCP server publishes via `npm publish` with GitHub Actions
8. All deployments MUST be behind staging environment first
9. Rollback plan: wrangler rollback or Pages deployment revert
10. No manual deployments — everything through CI/CD

## CI/CD Pipeline
```yaml
on push to main:
  1. Install dependencies
  2. Build all packages (core → mcp-server → dashboard)
  3. Run tests (core tests, future: mcp-server tests)
  4. Type check all packages
  5. Deploy workers (wrangler deploy)
  6. Deploy dashboard (Pages)
  7. Publish mcp-server (npm, on version tag only)
```

## Environment Variables
| Variable | Location | Purpose |
|----------|----------|---------|
| VOLT_SIGNING_KEY | Worker secret | Ed25519 private key |
| VOLT_PRICING | KV binding | Pricing feed storage |
| VOLT_DB | D1 binding | Observation database |
| NPM_TOKEN | GitHub secret | npm publish auth |

## Wrangler Config Template
```toml
name = "volt-price-aggregator"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[triggers]
crons = ["* * * * *"]  # every minute

[[kv_namespaces]]
binding = "VOLT_PRICING"
id = "xxx"

[[d1_databases]]
binding = "VOLT_DB"
database_name = "volt-observations"
database_id = "xxx"
```
