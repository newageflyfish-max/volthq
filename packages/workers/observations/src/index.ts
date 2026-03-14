/**
 * Volt HQ — Observations Worker
 *
 * Collects latency and success/failure observations from MCP clients.
 * Stores in D1 for aggregation by the price-aggregator.
 *
 * POST /v1/observe — record an observation
 */

export interface Env {
  DB: D1Database;
}

interface ObservationBody {
  providerId: string;
  model: string;
  latencyMs: number;
  success: boolean;
  errorType?: string;
  timestamp: string;
}

/** In-memory rate limit state (per-isolate). Resets on worker restart. */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const MAX_REQUESTS_PER_MINUTE = 100;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS_PER_MINUTE;
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

function validateBody(body: unknown): body is ObservationBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;

  if (typeof b.providerId !== 'string' || b.providerId.length === 0) return false;
  if (typeof b.model !== 'string' || b.model.length === 0) return false;
  if (typeof b.latencyMs !== 'number' || !Number.isFinite(b.latencyMs) || b.latencyMs < 0) return false;
  if (typeof b.success !== 'boolean') return false;
  if (typeof b.timestamp !== 'string' || b.timestamp.length === 0) return false;
  if (b.errorType !== undefined && typeof b.errorType !== 'string') return false;

  return true;
}

/** SHA-256 hash of the IP, truncated to 16 hex chars. */
async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 16);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({ status: 'ok' });
    }

    // Only accept POST /v1/observe
    if (url.pathname !== '/v1/observe' || request.method !== 'POST') {
      return jsonError('Not found', 404);
    }

    // Rate limit by IP
    const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
    if (isRateLimited(ip)) {
      return jsonError('Rate limit exceeded. Max 100 requests per minute.', 429);
    }

    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError('Invalid JSON body', 400);
    }

    if (!validateBody(body)) {
      return jsonError(
        'Invalid body. Required: providerId (string), model (string), latencyMs (number >= 0), success (boolean), timestamp (string). Optional: errorType (string).',
        400,
      );
    }

    // Write to D1
    const ipHash = await hashIp(ip);

    await env.DB.prepare(
      `INSERT INTO observations (provider_id, model, latency_ms, success, error_type, ip_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        body.providerId,
        body.model,
        Math.round(body.latencyMs),
        body.success ? 1 : 0,
        body.errorType ?? null,
        ipHash,
        body.timestamp,
      )
      .run();

    return Response.json({ ok: true }, { status: 201 });
  },
} satisfies ExportedHandler<Env>;
