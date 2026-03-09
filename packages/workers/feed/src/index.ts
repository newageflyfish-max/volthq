/**
 * Volt HQ — Feed Worker
 *
 * Serves the signed pricing feed from KV via HTTP.
 * Endpoint: GET /v1/prices
 *
 * Fast, cacheable, CORS-enabled. No compute — just reads from KV.
 */

interface Env {
  VOLT_PRICING: KVNamespace;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // ── GET /v1/prices — serve pricing feed ──────────────
    if (url.pathname === '/v1/prices') {
      const feed = await env.VOLT_PRICING.get('v1/prices');

      if (!feed) {
        return new Response(
          JSON.stringify({
            error: 'Feed not available',
            message: 'Pricing feed has not been generated yet. Try again in 60 seconds.',
          }),
          {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
              ...CORS_HEADERS,
            },
          },
        );
      }

      return new Response(feed, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          ...CORS_HEADERS,
        },
      });
    }

    // ── GET /health ──────────────────────────────────────
    if (url.pathname === '/health') {
      const feed = await env.VOLT_PRICING.get('v1/prices');
      let feedAge: number | null = null;

      if (feed) {
        try {
          const parsed = JSON.parse(feed) as { timestamp?: string };
          if (parsed.timestamp) {
            feedAge = Math.round((Date.now() - new Date(parsed.timestamp).getTime()) / 1000);
          }
        } catch {
          // ignore parse errors
        }
      }

      return new Response(
        JSON.stringify({
          status: feed ? 'ok' : 'no_feed',
          worker: 'feed',
          feedAgeSeconds: feedAge,
        }),
        { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
      );
    }

    // ── 404 ──────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        error: 'Not found',
        endpoints: ['/v1/prices', '/health'],
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      },
    );
  },
};
