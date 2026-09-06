# Boundary Atlas: ts-cross-feature-portal

- Generated: 2026-09-06T18:55:16.844Z
- Root: /workspace/scratch/e671c73efcba/boundary-atlas/fixtures/ts-cross-feature-portal

## Summary

- Files analyzed: 9
- Folders: 7
- Packages: 1
- Internal edges: 10
- Cycles: 0
- Deep imports: 0
- Dead exports: 1
- Boundary violations: 0
- Cross-feature dependencies: 2
- Hotspots: 2

## What stands out

- High-severity findings: 1
- Active detectors: Cross-feature dependencies (2), Dead exports (1), Hotspots (2)
- First issue to inspect: Cross-feature fan-out from src/features/checkout

## Findings

### Cross-feature fan-out from src/features/checkout
- Type: cross-feature
- Severity: high
- Summary: src/features/checkout/submit-order.ts depends on 4 other feature roots.
- Why risky: When one feature reaches into several peer features, feature ownership blurs and coordinated changes become more likely.
- Evidence: src/features/checkout/submit-order.ts -> src/features/auth/index.ts | specifier=../auth/index.js
- Evidence: src/features/checkout/submit-order.ts -> src/features/finance/index.ts | specifier=../finance/index.js
- Evidence: src/features/checkout/submit-order.ts -> src/features/marketing/index.ts | specifier=../marketing/index.js
- Evidence: src/features/checkout/submit-order.ts -> src/features/support/index.ts | specifier=../support/index.js

### Cross-feature fan-out from src/features/reporting
- Type: cross-feature
- Severity: warn
- Summary: src/features/reporting/build-daily-brief.ts depends on 2 other feature roots.
- Why risky: When one feature reaches into several peer features, feature ownership blurs and coordinated changes become more likely.
- Evidence: src/features/reporting/build-daily-brief.ts -> src/features/checkout/index.ts | specifier=../checkout/index.js
- Evidence: src/features/reporting/build-daily-brief.ts -> src/features/support/index.ts | specifier=../support/index.js

### Unused export opsPortalSnapshot
- Type: dead-export
- Severity: warn
- Summary: Export `opsPortalSnapshot` in src/app/render-ops-portal.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: src/app/render-ops-portal.ts:4 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### file hotspot: src/features/checkout/submit-order.ts
- Type: hotspot
- Severity: warn
- Summary: src/features/checkout/submit-order.ts has fan-in 1 and fan-out 4.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: src/features/checkout/submit-order.ts

### folder hotspot: src/features/checkout
- Type: hotspot
- Severity: warn
- Summary: src/features/checkout has fan-in 2 and fan-out 4.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: src/features/checkout

## Hotspots

- file: src/features/checkout/submit-order.ts (fan-in 1, fan-out 4)
- folder: src/features/checkout (fan-in 2, fan-out 4)
