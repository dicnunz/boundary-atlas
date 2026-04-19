# Boundary Atlas: js-deep-import-storefront

- Generated: 2026-04-19T02:41:55.065Z
- Root: /Users/nicdunz/Documents/Codex/2026-04-18-go-through-my-github-and-decide/repo_audit/boundary-atlas/fixtures/js-deep-import-storefront

## Summary

- Files analyzed: 12
- Folders: 10
- Packages: 1
- Internal edges: 14
- Cycles: 0
- Deep imports: 3
- Dead exports: 1
- Boundary violations: 0
- Cross-feature dependencies: 0
- Hotspots: 5

## What stands out

- High-severity findings: 0
- Active detectors: Deep imports (3), Dead exports (1), Hotspots (5)
- First issue to inspect: Deep import into src/shared/data/internal/cache-records.js

## Findings

### Deep import into src/shared/data/internal/cache-records.js
- Type: deep-import
- Severity: warn
- Summary: src/features/cart/render-cart.js reaches into src/shared/data/internal/cache-records.js instead of using a public entrypoint.
- Why risky: This couples src/features/cart/render-cart.js to internals of js-deep-import-storefront. If the internal file moves or stops being exported, the importer breaks even though the package boundary may still be intact.
- Evidence: src/features/cart/render-cart.js -> src/shared/data/internal/cache-records.js | specifier=../../shared/data/internal/cache-records.js
- Evidence: Suggested public entrypoint | src/shared/data/index.js

### Deep import into src/shared/ui/internal/build-badge.js
- Type: deep-import
- Severity: warn
- Summary: src/features/catalog/show-inventory-tag.js reaches into src/shared/ui/internal/build-badge.js instead of using a public entrypoint.
- Why risky: This couples src/features/catalog/show-inventory-tag.js to internals of js-deep-import-storefront. If the internal file moves or stops being exported, the importer breaks even though the package boundary may still be intact.
- Evidence: src/features/catalog/show-inventory-tag.js -> src/shared/ui/internal/build-badge.js | specifier=../../shared/ui/internal/build-badge.js
- Evidence: Suggested public entrypoint | src/shared/ui/index.js

### Deep import into src/shared/ui/internal/theme-tokens.js
- Type: deep-import
- Severity: warn
- Summary: src/features/cart/render-cart.js reaches into src/shared/ui/internal/theme-tokens.js instead of using a public entrypoint.
- Why risky: This couples src/features/cart/render-cart.js to internals of js-deep-import-storefront. If the internal file moves or stops being exported, the importer breaks even though the package boundary may still be intact.
- Evidence: src/features/cart/render-cart.js -> src/shared/ui/internal/theme-tokens.js | specifier=../../shared/ui/internal/theme-tokens.js
- Evidence: Suggested public entrypoint | src/shared/ui/index.js

### Unused export storefrontPreview
- Type: dead-export
- Severity: warn
- Summary: Export `storefrontPreview` in src/main.js is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: src/main.js:5 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### file hotspot: src/features/cart/render-cart.js
- Type: hotspot
- Severity: warn
- Summary: src/features/cart/render-cart.js has fan-in 1 and fan-out 3.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: src/features/cart/render-cart.js

### file hotspot: src/main.js
- Type: hotspot
- Severity: warn
- Summary: src/main.js has fan-in 0 and fan-out 3.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: src/main.js

### folder hotspot: src
- Type: hotspot
- Severity: warn
- Summary: src has fan-in 0 and fan-out 3.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: src

### folder hotspot: src/features/cart
- Type: hotspot
- Severity: warn
- Summary: src/features/cart has fan-in 1 and fan-out 3.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: src/features/cart

### folder hotspot: src/shared/ui/internal
- Type: hotspot
- Severity: warn
- Summary: src/shared/ui/internal has fan-in 3 and fan-out 0.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: src/shared/ui/internal

## Hotspots

- file: src/features/cart/render-cart.js (fan-in 1, fan-out 3)
- file: src/main.js (fan-in 0, fan-out 3)
- folder: src (fan-in 0, fan-out 3)
- folder: src/features/cart (fan-in 1, fan-out 3)
- folder: src/shared/ui/internal (fan-in 3, fan-out 0)
