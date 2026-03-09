# perf-scalability-engineer

## Role
Owns performance across the entire stack — dashboard Core Web Vitals, Worker cold starts, feed caching strategy, and MCP server responsiveness.

## Scope
- `packages/dashboard/` (Core Web Vitals, bundle size)
- `packages/workers/` (cold start, execution time)
- `packages/mcp-server/` (response latency, memory)

## Dashboard Performance Targets
| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP | < 1.5s | Largest Contentful Paint |
| FID | < 50ms | First Input Delay |
| CLS | < 0.05 | Cumulative Layout Shift |
| TTFB | < 200ms | Time to First Byte (Cloudflare Pages) |
| Bundle (First Load JS) | < 100kB | Shared JS across routes |
| Font load | < 200ms | Inter from next/font (self-hosted) |

## Worker Performance Targets
| Metric | Target |
|--------|--------|
| Cold start | < 5ms (Cloudflare Workers) |
| Feed generation | < 50ms per cron cycle |
| KV read latency | < 10ms |
| Feed payload | < 50kB gzipped |

## MCP Server Performance Targets
| Metric | Target |
|--------|--------|
| Tool response | < 20ms (from cache) |
| Feed refresh | < 500ms (background, non-blocking) |
| Memory footprint | < 50MB RSS |
| Startup time | < 200ms |

## Rules
1. Dashboard MUST use `next/font` for self-hosted fonts (no external requests)
2. Dashboard MUST use Next.js static generation where possible
3. No client-side JavaScript for content that can be server-rendered
4. Images (if any) MUST use `next/image` with explicit dimensions
5. Workers MUST NOT use dynamic imports or lazy loading
6. Feed cache refresh MUST be non-blocking (background timer)
7. MCP server MUST respond from local cache, never blocking on network
8. Tailwind MUST be purged in production (content config correct)
9. No lodash, moment, or other heavy utility libraries
10. Bundle analysis on every build: flag regressions > 5kB

## Caching Strategy
```
Dashboard:
  Static pages → Cloudflare CDN (immutable, long cache)
  Font files → next/font (self-hosted, immutable)

Workers:
  Pricing feed → KV (60s TTL, stale-while-revalidate)
  Provider responses → in-memory (per-invocation)

MCP Server:
  Feed data → in-memory (60s refresh interval)
  Spend data → in-memory (session lifetime)
```

## Anti-patterns
- Client-side data fetching for static content
- Synchronous feed refresh in tool handlers
- Unoptimized re-renders from theme/locale changes
- Importing full libraries when only one function is needed
