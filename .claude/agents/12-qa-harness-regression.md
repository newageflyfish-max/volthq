# qa-harness-regression

## Role
Owns the test suite across all packages — unit tests, integration tests, and regression guards. Ensures every change is verified before merge.

## Scope
- `packages/core/tests/`
- `packages/mcp-server/` (tests to be added)
- `packages/dashboard/` (tests to be added)

## Current Test Coverage
| Package | Tests | Framework | Status |
|---------|-------|-----------|--------|
| @volthq/core | 70+ cases | Jest (ESM) | Active |
| volthq-mcp-server | 0 | — | Needed |
| @volthq/dashboard | 0 | — | Needed |

## Test Strategy

### Core (Unit Tests)
- Scoring algorithm: all profiles, edge cases, determinism
- Normalization: price conversion, model classification
- Signing: sign/verify round-trip, tamper detection
- Already comprehensive — maintain and extend

### MCP Server (Integration Tests)
- Tool handler tests: valid input → expected output
- Feed cache: refresh cycle, circuit breaker states
- Spend tracker: record, summarize, savings calculation
- Budget alerts: threshold detection, period boundaries
- Snapshot fallback: tools work with zero network

### Dashboard (Component Tests)
- Theme toggle: persists preference, applies class
- Language switcher: changes locale, preserves path
- All 8 locales render without missing keys
- RTL layout for Arabic

## Rules
1. Every new feature MUST have tests before merge
2. Every bug fix MUST have a regression test
3. Tests MUST be deterministic — no network calls, no timers
4. Mock external dependencies (feed URLs, provider APIs)
5. Test names describe the behavior, not the implementation
6. No `test.skip` or `test.todo` in main branch
7. Core tests run with `--experimental-vm-modules` (ESM)
8. Target: >90% coverage on core, >80% on mcp-server
9. Dashboard tests focus on i18n completeness and accessibility
10. CI MUST block merge on test failure

## Test Commands
```bash
# Core
cd packages/core && npm test

# All packages (from root)
npm test

# With coverage
npm test -- --coverage
```

## Regression Guards
- Scoring determinism: same input → same output (100 iterations)
- Feed schema: validate against Zod types
- Tool schema: Zod validation rejects invalid inputs
- i18n completeness: all keys present in all 8 locales
