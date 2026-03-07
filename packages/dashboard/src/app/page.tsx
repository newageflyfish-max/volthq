export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* ── Nav ──────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-neutral-800 bg-[#0a0a0a]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="text-lg font-semibold tracking-tight text-white">
            Volt<span className="text-volt-400">HQ</span>
          </span>
          <div className="flex items-center gap-4 text-sm">
            <a href="#tools" className="text-neutral-400 hover:text-white transition-colors">
              Tools
            </a>
            <a href="#install" className="text-neutral-400 hover:text-white transition-colors">
              Install
            </a>
            <a
              href="https://github.com/newageflyfish-max/volthq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Your AI agent is overpaying by{' '}
          <span className="text-volt-400">80%</span>
        </h1>
        <p className="mt-4 max-w-lg text-lg text-neutral-400">
          The compute price oracle for AI agents.
        </p>
        <div className="mt-8 flex gap-4">
          <a
            href="#install"
            className="rounded-md bg-volt-500 px-5 py-2.5 text-sm font-medium text-black hover:bg-volt-400 transition-colors"
          >
            Install
          </a>
          <a
            href="https://github.com/newageflyfish-max/volthq"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </section>

      {/* ── Pricing Comparison ────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="mb-2 text-center text-sm font-medium uppercase tracking-widest text-volt-400">
          Price comparison
        </h2>
        <p className="mb-8 text-center text-neutral-500 text-sm">
          Same-tier models. Wildly different prices.
        </p>
        <div className="overflow-hidden rounded-lg border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50">
                <th className="px-6 py-3 font-medium text-neutral-400">Provider</th>
                <th className="px-6 py-3 font-medium text-neutral-400">Model</th>
                <th className="px-6 py-3 text-right font-medium text-neutral-400">Avg $/M tokens</th>
                <th className="px-6 py-3 text-right font-medium text-neutral-400">vs Cheapest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              <tr className="bg-emerald-950/20">
                <td className="px-6 py-4 text-white font-medium">Hyperbolic</td>
                <td className="px-6 py-4 text-neutral-300">Llama-70B (FP8)</td>
                <td className="px-6 py-4 text-right font-mono text-emerald-400">$0.40</td>
                <td className="px-6 py-4 text-right text-emerald-400 text-xs font-medium">cheapest</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-white font-medium">OpenAI</td>
                <td className="px-6 py-4 text-neutral-300">GPT-4o</td>
                <td className="px-6 py-4 text-right font-mono text-red-400">$6.25</td>
                <td className="px-6 py-4 text-right text-red-400 text-xs font-medium">15.6x more</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-white font-medium">Anthropic</td>
                <td className="px-6 py-4 text-neutral-300">Claude Sonnet 4.6</td>
                <td className="px-6 py-4 text-right font-mono text-red-400">$9.00</td>
                <td className="px-6 py-4 text-right text-red-400 text-xs font-medium">22.5x more</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-xs text-neutral-600">
          Prices as of March 2026. Per-million-token average of input + output.
        </p>
      </section>

      {/* ── Tools ─────────────────────────────────────── */}
      <section id="tools" className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-volt-400">
          MCP Tools
        </h2>
        <div className="space-y-4">
          {tools.map((t) => (
            <div
              key={t.name}
              className="flex items-start gap-4 rounded-lg border border-neutral-800 bg-neutral-900/30 px-6 py-4"
            >
              <code className="shrink-0 rounded bg-neutral-800 px-2 py-1 text-xs font-medium text-volt-400">
                {t.name}
              </code>
              <p className="text-sm text-neutral-400">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Install ───────────────────────────────────── */}
      <section id="install" className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-volt-400">
          Install
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-medium text-neutral-300">Cursor</h3>
            <p className="mb-2 text-xs text-neutral-500">.cursor/mcp.json</p>
            <pre className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 text-xs leading-relaxed text-neutral-300">
{`{
  "mcpServers": {
    "volthq": {
      "command": "npx",
      "args": ["-y", "volthq-mcp-server"]
    }
  }
}`}
            </pre>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-medium text-neutral-300">Claude Desktop</h3>
            <p className="mb-2 text-xs text-neutral-500">claude_desktop_config.json</p>
            <pre className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 text-xs leading-relaxed text-neutral-300">
{`{
  "mcpServers": {
    "volthq": {
      "command": "npx",
      "args": ["-y", "volthq-mcp-server"]
    }
  }
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="border-t border-neutral-800 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <span className="text-sm text-neutral-500">
            Volt<span className="text-volt-500">HQ</span> — the compute price oracle for AI agents
          </span>
          <div className="flex gap-6 text-sm text-neutral-500">
            <a
              href="https://www.npmjs.com/package/volthq-mcp-server"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              npm
            </a>
            <a
              href="https://github.com/newageflyfish-max/volthq"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://volthq.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              volthq.dev
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

const tools = [
  { name: 'volt_check_price', desc: 'Compare pricing across providers for a model.' },
  { name: 'volt_recommend_route', desc: 'Get optimal provider recommendation with savings estimate.' },
  { name: 'volt_get_spend', desc: 'Spending summary by provider and model (today/7d/30d).' },
  { name: 'volt_get_savings', desc: 'Actual spend vs optimized spend comparison.' },
  { name: 'volt_set_budget_alert', desc: 'Set daily/weekly/monthly budget threshold alerts.' },
];
