'use client';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'For individuals exploring compute pricing.',
    features: [
      'Price comparisons across 8 providers',
      '106+ model offerings',
      'Basic routing recommendations',
      'Community support',
    ],
    cta: 'Current plan',
    highlighted: false,
    priceEnv: null,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/mo',
    description: 'For teams shipping AI products.',
    features: [
      'Everything in Free',
      'Spend tracking & budget alerts',
      'Savings reports by provider',
      'Priority support',
      'Webhook notifications',
    ],
    cta: 'Get started',
    highlighted: true,
    priceEnv: 'pro',
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/mo',
    description: 'For organizations at scale.',
    features: [
      'Everything in Pro',
      'Custom routing policies',
      'SSO & team management',
      'SLA guarantee',
      'Dedicated support',
      'Audit logs',
    ],
    cta: 'Get started',
    highlighted: false,
    priceEnv: 'enterprise',
  },
] as const;

async function handleCheckout(tier: 'pro' | 'enterprise') {
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    });

    const data = await res.json();

    if (!res.ok || !data.url) {
      alert(data.error ?? 'Checkout is not available yet. Please try again later.');
      return;
    }

    window.location.href = data.url;
  } catch {
    alert('Unable to connect to checkout. Please try again later.');
  }
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* ── Nav ──────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-neutral-800 bg-[#0a0a0a]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <a href="/" className="text-lg font-semibold tracking-tight text-white">
            Volt<span className="text-volt-400">HQ</span>
          </a>
          <div className="flex items-center gap-4 text-sm">
            <a href="/#tools" className="text-neutral-400 hover:text-white transition-colors">
              Tools
            </a>
            <a href="/pricing" className="text-white transition-colors">
              Pricing
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

      {/* ── Pricing ─────────────────────────────────── */}
      <section className="flex flex-col items-center px-4 sm:px-6 pt-28 sm:pt-32 pb-14 sm:pb-20">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Pricing
        </h1>
        <p className="mt-4 max-w-lg text-center text-lg text-neutral-400">
          Start free. Upgrade when you need spend tracking and budget alerts.
        </p>

        <div className="mt-12 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-lg border p-6 ${
                tier.highlighted
                  ? 'border-volt-500 bg-volt-950/10'
                  : 'border-neutral-800 bg-neutral-900/30'
              }`}
            >
              <h2 className="text-sm font-medium uppercase tracking-widest text-volt-400">
                {tier.name}
              </h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                <span className="text-neutral-500">{tier.period}</span>
              </div>
              <p className="mt-3 text-sm text-neutral-500">{tier.description}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-neutral-400">
                    <span className="mt-0.5 text-volt-500">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>

              {tier.priceEnv ? (
                <button
                  onClick={() => handleCheckout(tier.priceEnv)}
                  className="mt-8 w-full rounded-md bg-volt-500 px-4 py-2.5 text-sm font-medium text-black hover:bg-volt-400 transition-colors"
                >
                  {tier.cta}
                </button>
              ) : (
                <button
                  disabled
                  className="mt-8 w-full rounded-md bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-500 cursor-default"
                >
                  {tier.cta}
                </button>
              )}
            </div>
          ))}
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
          </div>
        </div>
      </footer>
    </main>
  );
}
