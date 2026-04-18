# Web Demo Contract

The current web app is a static landing shell, not the finished report viewer. The e2e suite should protect that real state instead of inventing interactions that do not exist yet.

## What Exists

- document title `Boundary Atlas`
- a visible `main` shell and hero card
- eyebrow copy `Boundary Atlas`
- heading `Architecture radar for TypeScript codebases.`
- body copy that mentions exported reports, graph evidence, hotspots, cycles, and drift

## What E2E Enforces

- the page loads without browser console errors or page errors
- the hero shell is visible
- the current copy is present
- no empty interactive controls ship yet

If the demo state changes, update this document and the Playwright spec together.
