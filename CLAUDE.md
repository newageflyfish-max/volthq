# CLAUDE.md — Volt HQ

## CRITICAL: Read This First
Volt HQ is a **compute price oracle and routing decision engine** for AI agents. It is NOT a dashboard company. It is NOT an observability tool. It is NOT a blockchain protocol. It is a **data platform** that aggregates real-time compute pricing across centralized and decentralized providers, and delivers routing recommendations via an MCP server.

The product is: **MCP server + pricing feed + observation network.**
The moat is: **the dataset.**
The revenue is: **performance fees on demonstrated savings.**

## Project Identity
- **Name:** Volt HQ
- **Tagline:** The compute price oracle for AI agents
- **Domain:** volthq.dev
- **Founder:** Jack Arnot (solo founder)
- **Stage:** Pre-launch, building Phase 0
- **GitHub:** TBD
- **npm package:** volthq-mcp-server

## What Volt HQ Does
1. **Aggregates** real-time compute pricing from centralized (OpenAI, Anthropic, Groq, Together AI, DeepInfra, Fireworks AI) and decentralized (Akash, Hyperbolic) providers
2. **Publishes** a signed pricing feed via CDN that any agent can consume
3. **Recommends** optimal routing: "You're about to pay $0.03. Same quality for $0.003 on Hyperbolic."
4. **Tracks** agent compute spend and demonstrates savings
5. **Collects** anonymous observation data from agents to build quality/reliability scores

## Architecture (Architecture F: Signed Edge Feed)

### Infrastructure: Cloudflare Workers (zero server management)
- Price Aggregation Worker: Cron every 60s, polls provider APIs, signs feed, writes to KV
- Feed Worker: Serves signed pricing feed from KV with Worker-level caching
- Observation Worker: Ingests batched observations from MCP servers, writes to D1
- Aggregate Worker: Cron every 5min, computes quality/reliability scores from observations

### MCP Server (npm package — the product)
- Local cache of pricing feed (refreshed every 60s)
- Routing engine (scoring algorithm: quality × reliability × latency_fit / normalized_price)
- Observation collector (buffers inference call metadata, flushes every 60s)
- Fail-open circuit breaker (if anything fails, passes through transparently)
- Budget alerts (warn when spend exceeds threshold)

### MCP Tools Exposed
- `volt_check_price` — Compare pricing across providers for a given model/task
- `volt_recommend_route` — Get optimal provider recommendation
- `volt_get_spend` — Spending summary (today/week/month)
- `volt_get_savings` — Actual vs optimized spend comparison
- `volt_set_budget_alert` — Configure spend threshold alerts

## Key Design Principles
1. **Fail-open**: The MCP server NEVER degrades agent inference. If oracle fails, pass through transparently.
2. **Zero-config first run**: Install, see value, no account needed.
3. **Privacy by schema**: Observation data NEVER includes prompts, outputs, or API keys. Schema has no fields for content.
4. **Data is the moat**: Every agent that uses Volt contributes to the pricing dataset that makes Volt more valuable.
5. **Advisory first**: We recommend, the agent decides. No active routing until trust is proven.

## Scoring Algorithm
```
score = (quality × reliability × latency_fit) / normalized_price

quality (0-1): Benchmark-based. BF16 reference = 1.0, FP8 ≈ 0.97, INT4 ≈ 0.89
reliability (0-1): success_count / total_count, time-weighted (recent > old)
latency_fit (0-1): Curve based on provider latency vs agent's tolerance
normalized_price (0-1): Provider price as fraction of most expensive option

Weights are agent-configurable via routing profile:
  { optimize: "cost" | "latency" | "reliability" | "balanced" }
```

## Offering Schema (atomic unit)
```
provider + model + quantization + GPU type + region = one offering
```
Each offering has: price, quality_score, reliability_score, latency_p50/p95, observation_count, status, last_updated.

## Revenue Model
- Layer 1 (free): Pricing feed, spend tracking, budget alerts
- Layer 2 (performance fee): 20% of demonstrated savings when agents follow recommendations
- Layer 3 (future): Data subscriptions for providers/researchers, routing margin on settlement

## Tech Stack
- **Language:** TypeScript (MCP SDK is TypeScript-native)
- **Infrastructure:** Cloudflare Workers + KV + D1 (free tier, $0-5/month)
- **MCP Server:** npm package using @modelcontextprotocol/sdk
- **Dashboard:** React + Tailwind on Cloudflare Pages
- **Signing:** Ed25519 for feed integrity
- **Database:** Cloudflare D1 (SQLite) for observations, KV for pricing feed

## Build Phases
- Phase 0 (Week 1-2): Core types + Hyperbolic adapter + pricing feed + signed KV
- Phase 1 (Week 2-4): MCP server with cache, routing engine, circuit breaker
- Phase 2 (Week 4-6): Observation pipeline, contributor network, benchmarks
- Phase 3 (Week 6-10): Dashboard, content launch, first users
- Phase 4 (Week 10-16): Performance fee billing, grants, provider partnerships

## What This Is NOT
- NOT an agent framework (we don't build agents)
- NOT an LLM gateway (we don't proxy traffic in advisory mode)
- NOT a blockchain product (no tokens, no smart contracts)
- NOT an observability tool (we don't do traces, debugging, or logging)
- NOT Helicone (they do centralized LLM monitoring; we do cross-provider pricing + DePIN)

## Kill Criteria (Month 6 — all four must be true to kill)
1. Fewer than 20 active tracked agents
2. Total revenue under $1,000 cumulative
3. No grant funding received or in pipeline
4. DePIN provider APIs too immature to integrate

## Build Rules
When a new provider adapter is added or offerings change, always update all four surfaces:
1. `README.md` — supported providers list and example output
2. `packages/mcp-server/src/snapshot.ts` — add/update offerings
3. `packages/dashboard/src/app/page.tsx` — pricing comparison table
4. `packages/mcp-server/README.md` — copy from root README

After changes: run `npm run build` in `packages/core` and `packages/mcp-server`, bump version in `packages/mcp-server/package.json`, publish with `npm publish --access public`, and deploy dashboard with `npx vercel --yes --prod` from the repo root.

## Previous Work That Feeds Into This
- Arena Protocol: FICO scoring algorithm → provider reliability scoring
- Arena auctions: score = stake × rep / price → compute routing optimization
- x402 research: payment protocol knowledge → settlement layer design
- Hyperliquid Brain: wallet scoring system → provider scoring system
- Touch Grass Capital: content distribution channel
