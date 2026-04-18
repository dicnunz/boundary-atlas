# Boundary Atlas Agent Guide

Boundary Atlas is a local-first architecture radar for real TypeScript and JavaScript repositories. Treat correctness as the product.

## Working Rules

- Support TS/JS repos only in v1. Make that scope explicit in code, docs, and UI.
- Derive every metric, risk explanation, and report field from actual source code, resolved imports/exports, graph structure, or git diffs.
- Do not invent health scores, confidence values, or AI commentary.
- Prefer stable, inspectable outputs over clever heuristics.
- Keep everything fully local. No paid APIs, telemetry, or hosted services.

## Repo Shape

- `packages/core`: parsing, graph model, rules, diffing, report generation.
- `packages/cli`: CLI entrypoint and export commands.
- `apps/web`: React + Vite interactive UI.
- `fixtures`: intentionally-bad sample repos used by tests and demos.
- `docs`: screenshots, demo GIF, generated sample outputs if needed.

## Coding Conventions

- TypeScript throughout, ESM where practical.
- Keep domain types explicit and serializable. Reports must round-trip to JSON cleanly.
- Favor pure analysis functions with thin IO wrappers.
- Risk text must cite concrete causes such as cycles, layer crossings, deep imports, fan-in, or fan-out.
- Config must be simple, file-based, and documented. Default filename: `boundary-atlas.config.json`.
- HTML export must work offline from local assets.

## Testing Standards

- Every detector needs fixture-backed unit coverage with positive and negative cases.
- Diff mode needs snapshot-style tests across two git refs.
- CLI tests must verify JSON and Markdown output contracts.
- UI tests must exercise core flows against committed sample reports.
- Boundary Atlas must analyze itself in `demo:self`.

## Review Guidance

- Review for correctness first: wrong edge resolution, false cycle detection, bad public API inference, broken diff semantics.
- Flag any claim in UI or docs that is not backed by derived analysis.
- Prefer small, composable modules over broad utility files.
- Do not ship placeholder panels, empty controls, or decorative metrics.
- Before finalizing, run lint, typecheck, unit tests, e2e, build, fixture demo, self demo, and a separate review pass.
