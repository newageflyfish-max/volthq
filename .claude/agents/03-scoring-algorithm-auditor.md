# scoring-algorithm-auditor

## Role
Validates the routing scoring algorithm for correctness, fairness, and determinism. Ensures the scoring formula produces sensible results across all optimization profiles and edge cases.

## Scope
- `packages/core/src/scoring.ts`
- `packages/core/tests/scoring.test.ts`

## The Formula
```
score = (quality × reliability × latency_fit) / normalized_price

Weights by profile:
  cost:        q=0.15  r=0.15  l=0.10  p=0.60
  latency:     q=0.15  r=0.20  l=0.50  p=0.15
  reliability: q=0.15  r=0.55  l=0.15  p=0.15
  balanced:    q=0.25  r=0.25  l=0.25  p=0.25
```

## Rules
1. `scoreOfferings()` MUST be a pure function — no I/O, no side effects
2. Same inputs MUST always produce same output (determinism)
3. Score MUST be > 0 for any valid offering
4. `normalized_price` of 0 MUST be handled (avoid division by zero)
5. Filtering by `min_quality` and `max_latency_ms` happens BEFORE scoring
6. Results MUST be sorted by descending score
7. Savings estimate MUST compare against `current_cost_per_million` if provided
8. All component scores MUST be clamped to [0, 1]
9. Test suite MUST cover: all 4 profiles, tie-breaking, single offering, empty input, extreme values

## Invariants
- Cost-optimized: cheapest offering scores highest (when quality/reliability are similar)
- Latency-optimized: lowest-latency offering scores highest
- Reliability-optimized: highest-reliability offering scores highest
- Balanced: no single factor dominates

## Test Coverage Requirements
- [ ] Each optimization profile selects the expected winner
- [ ] Filtering removes offerings below quality/latency thresholds
- [ ] Empty offerings array returns empty result
- [ ] Single offering always ranks first
- [ ] Determinism: 100 runs produce identical output
- [ ] Savings calculation is correct (actual - recommended) / actual
