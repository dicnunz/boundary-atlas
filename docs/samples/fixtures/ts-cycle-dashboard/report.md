# Boundary Atlas: ts-cycle-dashboard

- Generated: 2026-05-10T05:42:29.584Z
- Root: /Users/nicdunz/Documents/Codex/2026-05-09/goal-chrome-plugin-chrome-openai-bundled-3/repos/boundary-atlas/fixtures/ts-cycle-dashboard

## Summary

- Files analyzed: 6
- Folders: 3
- Packages: 1
- Internal edges: 7
- Cycles: 2
- Deep imports: 0
- Dead exports: 1
- Boundary violations: 0
- Cross-feature dependencies: 2
- Hotspots: 0

## What stands out

- High-severity findings: 1
- Active detectors: Cycles (2), Cross-feature dependencies (2), Dead exports (1)
- First issue to inspect: file cycle across 4 nodes

## Findings

### file cycle across 4 nodes
- Type: cycle
- Severity: high
- Summary: Detected a strongly connected component in the file graph.
- Why risky: Every node in this cycle depends on another node in the same loop. That increases change coupling and makes dependency direction harder to reason about.
- Evidence: src/features/account/index.ts
- Evidence: src/features/account/load-account-summary.ts
- Evidence: src/features/billing/calculate-outstanding-balance.ts
- Evidence: src/features/billing/index.ts

### Cross-feature fan-out from src/features/account
- Type: cross-feature
- Severity: warn
- Summary: src/features/account/load-account-summary.ts depends on 1 other feature roots.
- Why risky: When one feature reaches into several peer features, feature ownership blurs and coordinated changes become more likely.
- Evidence: src/features/account/load-account-summary.ts -> src/features/billing/index.ts | specifier=../billing/index.js

### Cross-feature fan-out from src/features/billing
- Type: cross-feature
- Severity: warn
- Summary: src/features/billing/calculate-outstanding-balance.ts depends on 1 other feature roots.
- Why risky: When one feature reaches into several peer features, feature ownership blurs and coordinated changes become more likely.
- Evidence: src/features/billing/calculate-outstanding-balance.ts -> src/features/account/index.ts | specifier=../account/index.js

### folder cycle across 2 nodes
- Type: cycle
- Severity: warn
- Summary: Detected a strongly connected component in the folder graph.
- Why risky: Every node in this cycle depends on another node in the same loop. That increases change coupling and makes dependency direction harder to reason about.
- Evidence: src/features/account
- Evidence: src/features/billing

### Unused export accountSummary
- Type: dead-export
- Severity: warn
- Summary: Export `accountSummary` in src/main.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: src/main.ts:3 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

## Hotspots

No hotspots above threshold.
