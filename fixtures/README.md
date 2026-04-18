# Fixture Catalog

Each fixture is a standalone minimal TS or JS repo. The expected findings are grounded in source structure only. No fixture depends on a custom Boundary Atlas config file or a fabricated report payload.

| Fixture | Tech | Detector target | Key evidence |
| --- | --- | --- | --- |
| `ts-cycle-dashboard` | TypeScript | cycle detection | `account/index.ts -> load-account-summary.ts -> billing/index.ts -> calculate-outstanding-balance.ts -> account/index.ts` |
| `js-deep-import-storefront` | JavaScript | deep import detection | feature files import `shared/ui/internal/*` and `shared/data/internal/*` instead of public entrypoints |
| `ts-dead-exports-reporting` | TypeScript | dead export detection | `formatters.ts` exports live and dead symbols side by side, but only `formatFinding` is referenced |
| `ts-cross-feature-portal` | TypeScript | risky cross-feature dependency detection | `checkout/submit-order.ts` fans out to `auth`, `finance`, `marketing`, and `support` feature APIs |

## ts-cycle-dashboard

Expected findings:

- one cycle across the `account` and `billing` features
- barrel imports are the concrete cause

Primary evidence:

- `src/features/account/index.ts`
- `src/features/account/load-account-summary.ts`
- `src/features/billing/index.ts`
- `src/features/billing/calculate-outstanding-balance.ts`

## js-deep-import-storefront

Expected findings:

- deep imports into `internal` modules from feature code
- public entrypoints exist in the same shared folders, so the deep import is avoidable

Primary evidence:

- `src/features/cart/render-cart.js`
- `src/features/catalog/show-inventory-tag.js`
- `src/shared/ui/index.js`
- `src/shared/data/index.js`

## ts-dead-exports-reporting

Expected findings:

- `formatSeverityLabel`
- `formatLegacyRiskCallout`
- `obsoleteMarkdownPreamble`

Those symbols are exported from the same module as `formatFinding`, but only `formatFinding` is used anywhere in the repo.

Primary evidence:

- `src/report/formatters.ts`
- `src/report/build-finding-list.ts`
- `src/index.ts`

## ts-cross-feature-portal

Expected findings:

- risky feature-to-feature fan-out from `checkout`
- secondary cross-feature read dependency from `reporting`

Primary evidence:

- `src/features/checkout/submit-order.ts`
- `src/features/reporting/build-daily-brief.ts`
- `src/features/auth/index.ts`
- `src/features/finance/index.ts`
- `src/features/marketing/index.ts`
- `src/features/support/index.ts`
