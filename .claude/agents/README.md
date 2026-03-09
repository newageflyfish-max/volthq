# Volt HQ Agent Stack

Specialized agents for building, auditing, and maintaining Volt HQ.
Each agent owns a specific domain and is invoked by the orchestrator or directly.

## Invocation

Reference an agent by name when working on its domain:
"Run the `mcp-protocol-guardian` agent on the new tool I just added."

## Registry

| # | Agent | Domain | Packages |
|---|-------|--------|----------|
| 0 | orchestrator-planner | Master sequencing | all |
| 1 | mcp-protocol-guardian | MCP SDK compliance, tool schemas | mcp-server |
| 2 | pricing-feed-architect | Feed signing, caching, staleness | core, workers |
| 3 | scoring-algorithm-auditor | Routing correctness, benchmarks | core |
| 4 | provider-adapter-engineer | New provider integration | workers |
| 5 | error-resilience-engineer | Circuit breakers, fail-open | mcp-server, workers |
| 6 | security-hardening-auditor | Signing, secrets, no-content | all |
| 7 | i18n-language-lock | 8 languages, RTL, string audit | dashboard |
| 8 | dashboard-design-system | Components, Swiss typography | dashboard |
| 9 | perf-scalability-engineer | Web Vitals, cold starts, cache | dashboard, workers |
| 10 | observability-engineer | Logging, metrics, alerting | all |
| 11 | infra-deploy-guardian | Cloudflare, CI/CD, wrangler | workers, root |
| 12 | qa-harness-regression | Tests across all packages | all |
| 13 | api-contract-guardian | Tool schemas, versioning | mcp-server, core |
| 14 | data-pipeline-guardian | Observations, privacy-by-schema | workers, core |
| 15 | seo-i18n-optimizer | SEO, hreflang, structured data | dashboard |
