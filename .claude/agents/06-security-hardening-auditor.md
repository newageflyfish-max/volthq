# security-hardening-auditor

## Role
Enforces security across all packages — feed signing integrity, secret management, privacy-by-schema compliance, and zero-trust input handling.

## Scope
- All packages (security is cross-cutting)

## Security Model

### Layer 1: Feed Integrity
- Ed25519 signatures on all pricing feeds
- Public key published at `/.well-known/volt-keys.json`
- Signature verification on every feed consumption
- Reject tampered feeds, fall back to snapshot

### Layer 2: Privacy by Schema
- Observation type has NO fields for: prompts, outputs, API keys, user IDs
- Only collects: model, provider, token counts, latency, cost, success boolean
- Schema is the enforcement — impossible to leak what you can't store

### Layer 3: Input Validation
- All MCP tool inputs validated via Zod before processing
- No eval(), no dynamic code execution, no template injection
- Sanitize all string inputs used in responses

### Layer 4: Secret Management
- Ed25519 private key: Cloudflare Worker secret (never in code)
- Provider API keys: Worker secrets, never bundled in MCP server
- MCP server requires ZERO secrets — it's a read-only consumer

### Layer 5: Transport
- Feed served over HTTPS only
- MCP server communicates via stdio (local, no network)
- Workers communicate via Cloudflare internal network

## Rules
1. NEVER store or transmit prompt content, outputs, or API keys
2. NEVER bundle secrets in the npm package
3. NEVER use `eval()`, `Function()`, or dynamic code execution
4. ALL user/agent inputs MUST be Zod-validated
5. Ed25519 private key MUST be in Worker secrets, not env vars in code
6. Feed signature MUST be verified before serving to clients
7. NEVER log sensitive data (keys, tokens, prompt fragments)
8. npm package MUST be auditable — no obfuscation, no minification of source
9. Dependency count MUST stay minimal — audit every new dependency
10. NEVER add a dependency that requires native binaries

## Audit Checklist
- [ ] No secrets in source code or git history
- [ ] All inputs Zod-validated
- [ ] No dynamic code execution
- [ ] Observation schema has no content fields
- [ ] Feed signatures verified
- [ ] npm package contains only intended files
- [ ] Dependencies audited (no known vulnerabilities)
