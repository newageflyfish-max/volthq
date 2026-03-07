# Volt HQ

The compute price oracle for AI agents.

## What it does

- **Compares pricing** across centralized (OpenAI, Anthropic) and decentralized (Hyperbolic) providers in real time
- **Recommends optimal routing** — tells your agent where to get the same quality for less, with savings estimates
- **Tracks spend and budgets** — spending summaries by provider/model, savings reports, and threshold alerts

## Install for Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "volthq": {
      "command": "npx",
      "args": ["-y", "volthq-mcp-server"]
    }
  }
}
```

## Install for Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "volthq": {
      "command": "npx",
      "args": ["-y", "volthq-mcp-server"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `volt_check_price` | Compare pricing across providers for a model |
| `volt_recommend_route` | Get optimal provider recommendation with savings estimate |
| `volt_get_spend` | Spending summary by provider and model (today/7d/30d) |
| `volt_get_savings` | Actual spend vs optimized spend comparison |
| `volt_set_budget_alert` | Set daily/weekly/monthly budget threshold alerts |

## Example

```
> volt_check_price { "model": "llama-70b" }

Price comparison for "llama-70b" — 2 offerings found
────────────────────────────────────────────────────────────
1. Hyperbolic — Llama-70B (FP8) on H100-SXM
   Input: $0.40/M tokens | Output: $0.40/M tokens | Avg: $0.40/M
   Quality: 85% | Region: global

2. Hyperbolic — Llama-70B (BF16) on H100-SXM
   Input: $0.55/M tokens | Output: $0.55/M tokens | Avg: $0.55/M
   Quality: 88% | Region: global

Cheapest is 27% less than most expensive option.
```

Compare that to GPT-4o at $6.25/M avg — same-tier open-source model, 94% less.

## Supported providers

- **OpenAI** — GPT-4o, GPT-4o-mini
- **Anthropic** — Claude Sonnet 4.6, Claude Haiku 4.5
- **Hyperbolic** — DeepSeek-V3, DeepSeek-R1, Llama-70B, Llama-8B

More coming soon.

## Links

- npm: [volthq-mcp-server](https://www.npmjs.com/package/volthq-mcp-server)
- Web: [volthq.dev](https://volthq.dev)

## License

MIT
