#!/usr/bin/env node
/**
 * Volt HQ — MCP Server
 *
 * The compute price oracle for AI agents.
 * Exposes pricing comparison and routing recommendations via MCP tools.
 *
 * Design principles:
 *   - Fail-open: never degrades agent inference
 *   - Zero-config first run: install, see value, no account needed
 *   - Advisory first: we recommend, the agent decides
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { FeedCache } from './feed-cache.js';
import { checkPriceSchema, handleCheckPrice } from './tools/check-price.js';
import { recommendRouteSchema, handleRecommendRoute } from './tools/recommend-route.js';
const feedCache = new FeedCache();
const server = new McpServer({
    name: 'volthq',
    version: '0.1.0',
});
// ── volt_check_price ──────────────────────────────────
server.tool('volt_check_price', 'Compare pricing across providers for a given model. Returns offerings sorted by price with quality and reliability data.', checkPriceSchema.shape, async (input) => handleCheckPrice(checkPriceSchema.parse(input), feedCache));
// ── volt_recommend_route ──────────────────────────────
server.tool('volt_recommend_route', 'Get the optimal provider recommendation for a model based on cost, latency, reliability, or balanced optimization. Shows savings vs your current cost.', recommendRouteSchema.shape, async (input) => handleRecommendRoute(recommendRouteSchema.parse(input), feedCache));
// ── Start ─────────────────────────────────────────────
async function main() {
    feedCache.start();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error('Volt HQ MCP server failed to start:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map