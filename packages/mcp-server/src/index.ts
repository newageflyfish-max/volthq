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
import { SpendTracker } from './spend-tracker.js';
import { checkPriceSchema, handleCheckPrice } from './tools/check-price.js';
import { recommendRouteSchema, handleRecommendRoute } from './tools/recommend-route.js';
import { getSpendSchema, handleGetSpend } from './tools/get-spend.js';
import { getSavingsSchema, handleGetSavings } from './tools/get-savings.js';
import { setBudgetAlertSchema, handleSetBudgetAlert } from './tools/set-budget-alert.js';

const feedCache = new FeedCache();
const spendTracker = new SpendTracker(feedCache);

const server = new McpServer({
  name: 'volthq',
  version: '0.1.0',
});

// ── volt_check_price ──────────────────────────────────
server.tool(
  'volt_check_price',
  'Compare pricing across providers for a given model. Returns offerings sorted by price with quality and reliability data.',
  checkPriceSchema.shape,
  async (input) => handleCheckPrice(checkPriceSchema.parse(input), feedCache),
);

// ── volt_recommend_route ──────────────────────────────
server.tool(
  'volt_recommend_route',
  'Get the optimal provider recommendation for a model based on cost, latency, reliability, or balanced optimization. Shows savings vs your current cost.',
  recommendRouteSchema.shape,
  async (input) => handleRecommendRoute(recommendRouteSchema.parse(input), feedCache),
);

// ── volt_get_spend ────────────────────────────────────
server.tool(
  'volt_get_spend',
  'Get spending summary by provider and model for today, 7 days, or 30 days.',
  getSpendSchema.shape,
  async (input) => handleGetSpend(getSpendSchema.parse(input), spendTracker),
);

// ── volt_get_savings ──────────────────────────────────
server.tool(
  'volt_get_savings',
  'Compare actual spend against optimal routing. Shows savings achieved and savings missed.',
  getSavingsSchema.shape,
  async (input) => handleGetSavings(getSavingsSchema.parse(input), spendTracker),
);

// ── volt_set_budget_alert ─────────────────────────────
server.tool(
  'volt_set_budget_alert',
  'Set a budget threshold for daily, weekly, or monthly spend. Alerts when exceeded.',
  setBudgetAlertSchema.shape,
  async (input) => handleSetBudgetAlert(setBudgetAlertSchema.parse(input), spendTracker),
);

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
