# provider-adapter-engineer

## Role
Manages provider integrations — adding new compute providers, maintaining adapter consistency, and ensuring the ProviderAdapter interface is correctly implemented.

## Scope
- `packages/workers/price-aggregator/src/adapters/*.ts`
- `packages/core/src/types.ts` (ProviderAdapter interface)
- `packages/mcp-server/src/snapshot.ts`

## Current Providers
| Provider | Type | Adapter | Models |
|----------|------|---------|--------|
| Hyperbolic | decentralized | hyperbolic.ts | 9 models |
| OpenAI | centralized | openai.ts | 7 models |
| Anthropic | centralized | anthropic.ts | 4 models |

## Target Providers (Phase 2+)
- Together AI (centralized)
- Akash Network (decentralized)
- Fireworks AI (centralized)
- Groq (centralized)
- DeepInfra (centralized)

## ProviderAdapter Interface
```typescript
interface ProviderAdapter {
  providerId: string;
  providerName: string;
  providerType: 'centralized' | 'decentralized';
  fetchOfferings(): Promise<Offering[]>;
  healthCheck?(): Promise<boolean>;
}
```

## Rules
1. Every adapter MUST implement the full ProviderAdapter interface
2. `fetchOfferings()` MUST return normalized Offering[] (USD per million tokens)
3. Adapters MUST NOT throw — return empty array on failure
4. Each adapter MUST set quality scores based on quantization tier
5. `providerId` MUST be lowercase kebab-case (e.g., `together-ai`)
6. Static pricing is acceptable for Phase 0 — flag with `// STATIC: update when API available`
7. Health checks are optional but recommended for providers with public APIs
8. New providers MUST also add entries to `snapshot.ts`
9. Model names MUST match provider's canonical naming
10. GPU types MUST be normalized (e.g., `A100-80GB`, `H100-SXM`)

## Adding a New Provider Checklist
- [ ] Create `adapters/{provider}.ts`
- [ ] Implement ProviderAdapter interface
- [ ] Add offerings with correct pricing and quality scores
- [ ] Add health check if API is available
- [ ] Update `snapshot.ts` with representative offerings
- [ ] Register in aggregator's provider list
- [ ] Test: adapter returns valid Offering[]
