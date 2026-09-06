# Boundary Atlas: boundary-atlas

- Generated: 2026-09-06T18:55:18.726Z
- Root: /workspace/scratch/e671c73efcba/boundary-atlas

## Summary

- Files analyzed: 28
- Folders: 11
- Packages: 4
- Internal edges: 44
- Cycles: 0
- Deep imports: 0
- Dead exports: 38
- Boundary violations: 0
- Cross-feature dependencies: 0
- Hotspots: 12

## What stands out

- High-severity findings: 0
- Active detectors: Dead exports (38), Hotspots (12)
- First issue to inspect: Unused export basenamePath

## Findings

### Unused export basenamePath
- Type: dead-export
- Severity: warn
- Summary: Export `basenamePath` in packages/core/src/graph/path-utils.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/path-utils.ts:48 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasDrift
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasDrift` in apps/web/src/report-types.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: apps/web/src/report-types.ts:69 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasEdgeKind
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasEdgeKind` in packages/core/src/types/report.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/types/report.ts:12 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasFindingEvidence
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasFindingEvidence` in apps/web/src/report-types.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: apps/web/src/report-types.ts:38 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasFindingType
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasFindingType` in apps/web/src/report-types.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: apps/web/src/report-types.ts:2 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasFindingType
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasFindingType` in packages/core/src/types/report.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/types/report.ts:4 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasGitFileChange
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasGitFileChange` in packages/core/src/types/report.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/types/report.ts:129 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasGitFileChangeStatus
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasGitFileChangeStatus` in packages/core/src/types/report.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/types/report.ts:120 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasGraphDrift
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasGraphDrift` in packages/core/src/types/report.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/types/report.ts:135 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasGraphEdge
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasGraphEdge` in apps/web/src/report-types.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: apps/web/src/report-types.ts:23 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasHotspot
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasHotspot` in apps/web/src/report-types.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: apps/web/src/report-types.ts:58 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasProjectMetadata
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasProjectMetadata` in packages/core/src/types/report.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/types/report.ts:14 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasReportInput
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasReportInput` in packages/core/src/types/report.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/types/report.ts:183 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasRisk
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasRisk` in packages/core/src/types/report.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/types/report.ts:72 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasSeverity
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasSeverity` in apps/web/src/report-types.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: apps/web/src/report-types.ts:9 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasSeverity
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasSeverity` in packages/core/src/types/report.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/types/report.ts:11 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryAtlasSummary
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryAtlasSummary` in packages/core/src/types/report.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/types/report.ts:152 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export BoundaryRule
- Type: dead-export
- Severity: warn
- Summary: Export `BoundaryRule` in packages/core/src/types/config.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/types/config.ts:4 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export collectLocalExports
- Type: dead-export
- Severity: warn
- Summary: Export `collectLocalExports` in packages/core/src/graph/workspace.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/workspace.ts:291 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export createGraphNodeId
- Type: dead-export
- Severity: warn
- Summary: Export `createGraphNodeId` in packages/core/src/graph/path-utils.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/path-utils.ts:56 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export default
- Type: dead-export
- Severity: warn
- Summary: Export `default` in eslint.config.mjs is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: eslint.config.mjs:7 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export default
- Type: dead-export
- Severity: warn
- Summary: Export `default` in playwright.config.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: playwright.config.ts:3 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export default
- Type: dead-export
- Severity: warn
- Summary: Export `default` in vitest.config.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: vitest.config.ts:3 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export default
- Type: dead-export
- Severity: warn
- Summary: Export `default` in apps/web/vite.config.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: apps/web/vite.config.ts:4 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export dirnamePath
- Type: dead-export
- Severity: warn
- Summary: Export `dirnamePath` in packages/core/src/graph/path-utils.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/path-utils.ts:44 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export findOwningPackage
- Type: dead-export
- Severity: warn
- Summary: Export `findOwningPackage` in packages/core/src/graph/workspace.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/workspace.ts:211 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export hasSupportedSourceExtension
- Type: dead-export
- Severity: warn
- Summary: Export `hasSupportedSourceExtension` in packages/core/src/graph/path-utils.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/path-utils.ts:64 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export isWithinRoot
- Type: dead-export
- Severity: warn
- Summary: Export `isWithinRoot` in packages/core/src/graph/path-utils.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/path-utils.ts:68 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export LoadedBoundaryAtlasConfig
- Type: dead-export
- Severity: warn
- Summary: Export `LoadedBoundaryAtlasConfig` in packages/core/src/types/config.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/types/config.ts:18 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export LocalExportRecord
- Type: dead-export
- Severity: warn
- Summary: Export `LocalExportRecord` in packages/core/src/graph/workspace.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/workspace.ts:27 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export relativeDirectoryFromRoot
- Type: dead-export
- Severity: warn
- Summary: Export `relativeDirectoryFromRoot` in packages/core/src/graph/path-utils.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/path-utils.ts:35 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export relativePathFromRoot
- Type: dead-export
- Severity: warn
- Summary: Export `relativePathFromRoot` in packages/core/src/graph/path-utils.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/path-utils.ts:31 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export resolveConfigPath
- Type: dead-export
- Severity: warn
- Summary: Export `resolveConfigPath` in packages/core/src/types/config.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/types/config.ts:62 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export SOURCE_FILE_EXTENSIONS
- Type: dead-export
- Severity: warn
- Summary: Export `SOURCE_FILE_EXTENSIONS` in packages/core/src/graph/path-utils.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/path-utils.ts:14 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export SUPPORTED_SOURCE_EXTENSIONS
- Type: dead-export
- Severity: warn
- Summary: Export `SUPPORTED_SOURCE_EXTENSIONS` in packages/core/src/graph/path-utils.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/path-utils.ts:15 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export toPosixPath
- Type: dead-export
- Severity: warn
- Summary: Export `toPosixPath` in packages/core/src/graph/path-utils.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/path-utils.ts:17 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export uniqueSorted
- Type: dead-export
- Severity: warn
- Summary: Export `uniqueSorted` in packages/core/src/graph/path-utils.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/path-utils.ts:73 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### Unused export WorkspacePackage
- Type: dead-export
- Severity: warn
- Summary: Export `WorkspacePackage` in packages/core/src/graph/workspace.ts is not referenced internally.
- Why risky: Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.
- Evidence: packages/core/src/graph/workspace.ts:19 | No internal import or re-export references this export, and it is not part of a public entrypoint surface.

### file hotspot: apps/web/src/App.tsx
- Type: hotspot
- Severity: warn
- Summary: apps/web/src/App.tsx has fan-in 2 and fan-out 4.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: apps/web/src/App.tsx

### file hotspot: apps/web/src/report-types.ts
- Type: hotspot
- Severity: warn
- Summary: apps/web/src/report-types.ts has fan-in 6 and fan-out 0.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: apps/web/src/report-types.ts

### file hotspot: packages/core/src/analyze/analyze-repository.ts
- Type: hotspot
- Severity: warn
- Summary: packages/core/src/analyze/analyze-repository.ts has fan-in 3 and fan-out 6.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: packages/core/src/analyze/analyze-repository.ts

### file hotspot: packages/core/src/diff/compare-git-refs.ts
- Type: hotspot
- Severity: warn
- Summary: packages/core/src/diff/compare-git-refs.ts has fan-in 2 and fan-out 3.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: packages/core/src/diff/compare-git-refs.ts

### file hotspot: packages/core/src/graph/workspace.ts
- Type: hotspot
- Severity: warn
- Summary: packages/core/src/graph/workspace.ts has fan-in 3 and fan-out 2.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: packages/core/src/graph/workspace.ts

### file hotspot: packages/core/src/index.ts
- Type: hotspot
- Severity: warn
- Summary: packages/core/src/index.ts has fan-in 0 and fan-out 5.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: packages/core/src/index.ts

### file hotspot: packages/core/src/rules/findings.ts
- Type: hotspot
- Severity: warn
- Summary: packages/core/src/rules/findings.ts has fan-in 1 and fan-out 3.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: packages/core/src/rules/findings.ts

### file hotspot: packages/core/src/types/config.ts
- Type: hotspot
- Severity: warn
- Summary: packages/core/src/types/config.ts has fan-in 6 and fan-out 0.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: packages/core/src/types/config.ts

### file hotspot: packages/core/src/types/report.ts
- Type: hotspot
- Severity: warn
- Summary: packages/core/src/types/report.ts has fan-in 7 and fan-out 1.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: packages/core/src/types/report.ts

### folder hotspot: packages/core/src
- Type: hotspot
- Severity: warn
- Summary: packages/core/src has fan-in 0 and fan-out 4.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: packages/core/src

### folder hotspot: packages/core/src/analyze
- Type: hotspot
- Severity: warn
- Summary: packages/core/src/analyze has fan-in 2 and fan-out 3.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: packages/core/src/analyze

### folder hotspot: packages/core/src/types
- Type: hotspot
- Severity: warn
- Summary: packages/core/src/types has fan-in 6 and fan-out 0.
- Why risky: High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.
- Evidence: packages/core/src/types

## Hotspots

- file: packages/core/src/types/report.ts (fan-in 7, fan-out 1)
- file: apps/web/src/report-types.ts (fan-in 6, fan-out 0)
- file: packages/core/src/analyze/analyze-repository.ts (fan-in 3, fan-out 6)
- file: packages/core/src/types/config.ts (fan-in 6, fan-out 0)
- file: packages/core/src/index.ts (fan-in 0, fan-out 5)
- file: apps/web/src/App.tsx (fan-in 2, fan-out 4)
- file: packages/core/src/diff/compare-git-refs.ts (fan-in 2, fan-out 3)
- file: packages/core/src/graph/workspace.ts (fan-in 3, fan-out 2)
- file: packages/core/src/rules/findings.ts (fan-in 1, fan-out 3)
- folder: packages/core/src/types (fan-in 6, fan-out 0)
- folder: packages/core/src (fan-in 0, fan-out 4)
- folder: packages/core/src/analyze (fan-in 2, fan-out 3)
