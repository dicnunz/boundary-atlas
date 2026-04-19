# Web Demo Contract

The web app is the offline report viewer, not a placeholder shell.

## What Exists

- document title contains `Boundary Atlas`
- a visible hero that states the TS/JS repo scope and the offline-viewer value
- a committed demo report with a preselected finding so the page opens on a concrete issue
- graph switching across package, folder, and file scopes
- finding inspection with evidence-backed detail
- local JSON upload for viewing another report export

## What E2E Enforces

- the page loads without browser console errors or page errors
- the hero copy is visible
- a finding is already selected in the default demo state
- graph granularity can be switched interactively
- the user can select another finding and inspect it

If the viewer contract changes, update this document and the Playwright spec together.
