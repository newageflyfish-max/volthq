# Volt HQ

The compute price oracle for AI agents.

## What it does

- **Compares pricing** across centralized (OpenAI, Anthropic, Groq, Together AI) and decentralized (Hyperbolic, Akash) providers in real time
- **Recommends optimal routing** — tells your agent where to get the same quality for less, with savings estimates
- **Tracks spend and budgets** — spending summaries by provider/model, savings reports, and threshold alerts

## Install

Auto-configure Cursor and Claude Desktop in one command:

```
npx volthq-mcp-server --setup
```

Detects installed clients, merges config without overwriting your existing MCP servers.

<details>
<summary>Manual setup</summary>

**Cursor** — add to `.cursor/mcp.json`:

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

**Claude Desktop** — add to `claude_desktop_config.json`:

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

</details>

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

Price comparison for "llama-70b" — 6 offerings found
────────────────────────────────────────────────────────────
1. Hyperbolic — Llama-70B (FP8) on H100-SXM
   Input: $0.40/M tokens | Output: $0.40/M tokens | Avg: $0.40/M
   Quality: 85% | Region: global

2. Hyperbolic — Llama-70B (BF16) on H100-SXM
   Input: $0.55/M tokens | Output: $0.55/M tokens | Avg: $0.55/M
   Quality: 88% | Region: global

3. Groq — Llama-70B
   Input: $0.59/M tokens | Output: $0.79/M tokens | Avg: $0.69/M
   Quality: 88% | Region: global

4. Together AI — Llama-70B
   Input: $0.88/M tokens | Output: $0.88/M tokens | Avg: $0.88/M
   Quality: 88% | Region: global

5. Akash — Llama-70B (FP8) on H100-SXM
   Input: $3.49/M tokens | Output: $8.72/M tokens | Avg: $6.11/M
   Quality: 85% | Region: global

6. Akash — Llama-70B (FP8) on A100-80GB
   Input: $5.24/M tokens | Output: $13.11/M tokens | Avg: $9.18/M
   Quality: 85% | Region: global

Cheapest is 96% less than most expensive option.
```

Hyperbolic at $0.40/M, Groq at $0.69/M, Together AI at $0.88/M — all vs GPT-4o at $6.25/M.

## Supported providers

- **OpenAI** — GPT-4o, GPT-4o-mini
- **Anthropic** — Claude Sonnet 4.6, Claude Haiku 4.5
- **Groq** — Llama-70B, Llama-8B, Mixtral-8x7B
- **Together AI** — Llama-70B, Llama-8B, DeepSeek-V3
- **Hyperbolic** — DeepSeek-V3, DeepSeek-R1, Llama-70B, Llama-8B
- **Akash** — Llama-70B, Llama-8B on H100 and A100 (live GPU pricing)

## Links

- npm: [volthq-mcp-server](https://www.npmjs.com/package/volthq-mcp-server)
- Web: [volthq.dev](https://volthq.dev)

## License

MIT
