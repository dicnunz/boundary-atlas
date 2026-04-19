# Boundary Atlas: ts-dead-exports-reporting

- Generated: 2026-04-19T02:41:55.521Z
- Root: /Users/nicdunz/Documents/Codex/2026-04-18-go-through-my-github-and-decide/repo_audit/boundary-atlas/fixtures/ts-dead-exports-reporting

## Summary

- Files analyzed: 3
- Folders: 2
- Packages: 1
- Internal edges: 2
- Cycles: 0
- Deep imports: 0
- Dead exports: 3
- Boundary violations: 0
- Cross-feature dependencies: 0
- Hotspots: 0

## What stands out

- High-severity findings: 0
- Active detectors: Dead exports (3)
- First issue to inspect: Unused export formatLegacyRiskCallout

## Findings

### Unused export formatLegacyRiskCallout
- Type: dead-export
- Severity: warn
- Summary: Export `formatLegacyRiskCallout` in src/report/formatters.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: src/report/formatters.ts:9 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export formatSeverityLabel
- Type: dead-export
- Severity: warn
- Summary: Export `formatSeverityLabel` in src/report/formatters.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: src/report/formatters.ts:5 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export obsoleteMarkdownPreamble
- Type: dead-export
- Severity: warn
- Summary: Export `obsoleteMarkdownPreamble` in src/report/formatters.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: src/report/formatters.ts:13 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

## Hotspots

No hotspots above threshold.
