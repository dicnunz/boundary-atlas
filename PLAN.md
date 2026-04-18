# Boundary Atlas Plan

## Milestones

1. Foundation
   - Create npm workspaces, TypeScript/Vitest/Playwright/Vite/GitHub Actions baseline.
   - Define shared report schema and config contract.
2. Core Analysis
   - Parse TS/JS repos with `ts-morph`.
   - Build file, folder, and package graphs.
   - Detect cycles, deep imports, dead exports, fan-in/fan-out hotspots, risky cross-feature dependencies.
3. Diff + Exports
   - Compare two git refs and report architecture drift.
   - Export JSON, Markdown, and offline HTML.
4. UI
   - Ship interactive graph explorer with scope switching, filters, and evidence panels.
5. Proof
   - Add intentionally-bad fixtures, sample outputs, README assets, and self-analysis demo.
6. Finish
   - Run full validation, do a review pass, and leave push commands if auth is unavailable.

## Validation Commands

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run e2e
npm run build
npm run demo:fixtures
npm run demo:self
```

## Done Criteria

- Useful on non-trivial TS/JS repos.
- Reports explain why findings are risky using only derived code and graph facts.
- Fixtures prove detectors work.
- Boundary Atlas can analyze itself.
- CI passes from a clean clone.
