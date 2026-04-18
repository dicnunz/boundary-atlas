import path from 'node:path';
import picomatch from 'picomatch';
import type {
  BoundaryAtlasDeadExport,
  BoundaryAtlasFinding,
  BoundaryAtlasFindingEvidence,
  BoundaryAtlasGraph,
  BoundaryAtlasHotspot
} from '../types/report.js';
import { detectCycles, type DetectedCycle, selectHotspots } from '../graph/metrics.js';
import type { ImportEdgeRecord, ProjectGraphData, SourceNodeRecord } from '../graph/workspace.js';

function severityForCount(count: number): 'warn' | 'high' {
  return count >= 4 ? 'high' : 'warn';
}

function createFinding(
  type: BoundaryAtlasFinding['type'],
  title: string,
  summary: string,
  whyRisky: string,
  nodeIds: string[],
  evidence: BoundaryAtlasFindingEvidence[],
  metrics?: BoundaryAtlasFinding['metrics'],
  severity: BoundaryAtlasFinding['severity'] = 'warn'
): BoundaryAtlasFinding {
  const fingerprint = `${type}:${title}:${evidence
    .map((item) => `${item.sourcePath ?? ''}->${item.targetPath ?? ''}:${item.specifier ?? item.label}`)
    .join('|')}`;

  return {
    id: `finding:${fingerprint}`,
    fingerprint,
    type,
    severity,
    title,
    summary,
    whyRisky,
    nodeIds,
    evidence,
    ...(metrics ? { metrics } : {})
  };
}

function findPublicEntrypointsForTarget(projectGraph: ProjectGraphData, target: SourceNodeRecord): string[] {
  const packageEntrypoints = [...projectGraph.publicEntrypoints].filter((entrypoint) => {
    const targetPackage = projectGraph.packages.get(target.packageId);
    if (!targetPackage) {
      return false;
    }

    const packageRoot = targetPackage.rootRelativePath;
    if (packageRoot !== '.' && !entrypoint.startsWith(`${packageRoot}/`)) {
      return false;
    }

    const entryDir = path.posix.dirname(entrypoint);
    return target.path.startsWith(entryDir === '.' ? '' : `${entryDir}/`);
  });

  return packageEntrypoints.sort(
    (left, right) => path.posix.dirname(right).length - path.posix.dirname(left).length
  );
}

export function detectCycleFindings(
  graphs: Record<'file' | 'folder' | 'package', BoundaryAtlasGraph>
): { findings: BoundaryAtlasFinding[]; cycles: DetectedCycle[] } {
  const cycles = [
    ...detectCycles(graphs.file),
    ...detectCycles(graphs.folder),
    ...detectCycles(graphs.package)
  ];

  const findings = cycles.map((cycle) => {
    const graph = graphs[cycle.granularity];
    const labels = cycle.nodeIds
      .map((nodeId) => graph.nodes.find((node) => node.id === nodeId)?.path ?? nodeId)
      .sort();

    return createFinding(
      'cycle',
      `${cycle.granularity} cycle across ${labels.length} nodes`,
      `Detected a strongly connected component in the ${cycle.granularity} graph.`,
      'Every node in this cycle depends on another node in the same loop. That increases change coupling and makes dependency direction harder to reason about.',
      cycle.nodeIds,
      labels.map((label) => ({ label, sourcePath: label })),
      { nodeCount: labels.length },
      severityForCount(labels.length)
    );
  });

  return { findings, cycles };
}

function markUsedExports(projectGraph: ProjectGraphData): { deadExports: BoundaryAtlasDeadExport[] } {
  const used = new Set<string>();
  const publicReachable = new Set<string>();

  for (const node of projectGraph.nodes.values()) {
    if (node.isPublicEntrypoint) {
      for (const exported of node.exports) {
        publicReachable.add(`${node.path}#${exported.name}`);
      }
    }
  }

  for (const edge of projectGraph.edges) {
    const targetNode = projectGraph.nodes.get(edge.targetPath);
    if (!targetNode) {
      continue;
    }

    if (edge.importedNames.includes('*')) {
      for (const exported of targetNode.exports) {
        used.add(`${targetNode.path}#${exported.name}`);
        if (edge.kind === 'reexport') {
          publicReachable.add(`${targetNode.path}#${exported.name}`);
        }
      }
      continue;
    }

    for (const importedName of edge.importedNames) {
      used.add(`${targetNode.path}#${importedName}`);
      if (edge.kind === 'reexport') {
        publicReachable.add(`${targetNode.path}#${importedName}`);
      }
    }
  }

  const deadExports: BoundaryAtlasDeadExport[] = [];
  for (const node of projectGraph.nodes.values()) {
    for (const exported of node.exports) {
      const exportKey = `${node.path}#${exported.name}`;
      if (used.has(exportKey) || publicReachable.has(exportKey)) {
        continue;
      }

      deadExports.push({
        id: `dead-export:${exportKey}`,
        filePath: node.path,
        exportName: exported.name,
        line: exported.line,
        sourceNodeId: node.id,
        reason:
          'No internal import or re-export references this export, and it is not part of a public entrypoint surface.'
      });
    }
  }

  return { deadExports };
}

function groupEdgesByPair(edges: ImportEdgeRecord[]): Map<string, ImportEdgeRecord[]> {
  const grouped = new Map<string, ImportEdgeRecord[]>();
  for (const edge of edges) {
    const key = `${edge.sourcePath}->${edge.targetPath}`;
    const current = grouped.get(key) ?? [];
    current.push(edge);
    grouped.set(key, current);
  }
  return grouped;
}

function formatEdgeEvidence(edge: ImportEdgeRecord): BoundaryAtlasFindingEvidence {
  return {
    label: `${edge.sourcePath} -> ${edge.targetPath}`,
    sourcePath: edge.sourcePath,
    targetPath: edge.targetPath,
    specifier: edge.specifier
  };
}

export function detectStructuralFindings(projectGraph: ProjectGraphData): {
  findings: BoundaryAtlasFinding[];
  deadExports: BoundaryAtlasDeadExport[];
} {
  const findings: BoundaryAtlasFinding[] = [];
  const groupedEdges = groupEdgesByPair(projectGraph.edges);
  const boundaryRules = projectGraph.config.boundaries ?? [];
  const { deadExports } = markUsedExports(projectGraph);
  const crossFeatureFanout = new Map<
    string,
    {
      sourceNode: SourceNodeRecord;
      targetFeatures: Set<string>;
      edges: ImportEdgeRecord[];
    }
  >();

  for (const deadExport of deadExports) {
    findings.push(
      createFinding(
        'dead-export',
        `Unused export ${deadExport.exportName}`,
        `Export \`${deadExport.exportName}\` in ${deadExport.filePath} is not referenced internally.`,
        'Unused exports widen the apparent public surface and make the module harder to maintain because callers cannot distinguish real API from stale code.',
        [deadExport.sourceNodeId],
        [
          {
            label: `${deadExport.filePath}:${deadExport.line}`,
            sourcePath: deadExport.filePath,
            details: deadExport.reason
          }
        ],
        { exportName: deadExport.exportName, line: deadExport.line }
      )
    );
  }

  for (const edges of groupedEdges.values()) {
    const firstEdge = edges[0]!;
    const sourceNode = projectGraph.nodes.get(firstEdge.sourcePath);
    const targetNode = projectGraph.nodes.get(firstEdge.targetPath);
    if (!sourceNode || !targetNode) {
      continue;
    }

    const publicEntrypoints = findPublicEntrypointsForTarget(projectGraph, targetNode);
    const differentFeature = Boolean(
      sourceNode.featureRoot && targetNode.featureRoot && sourceNode.featureRoot !== targetNode.featureRoot
    );
    const entryRoot = publicEntrypoints[0] ? path.posix.dirname(publicEntrypoints[0]) : undefined;
    const sourceOutsideEntryRoot = entryRoot
      ? !sourceNode.path.startsWith(entryRoot === '.' ? '' : `${entryRoot}/`)
      : false;
    const bypassesPublicSurface =
      !targetNode.isPublicEntrypoint &&
      publicEntrypoints.length > 0 &&
      sourceOutsideEntryRoot;

    if (differentFeature && sourceNode.featureRoot && targetNode.featureRoot) {
      const current = crossFeatureFanout.get(sourceNode.featureRoot) ?? {
        sourceNode,
        targetFeatures: new Set<string>(),
        edges: []
      };
      current.targetFeatures.add(targetNode.featureRoot);
      current.edges.push(...edges);
      crossFeatureFanout.set(sourceNode.featureRoot, current);
    }

    if (bypassesPublicSurface) {
      findings.push(
        createFinding(
          'deep-import',
          `Deep import into ${targetNode.path}`,
          `${sourceNode.path} reaches into ${targetNode.path} instead of using a public entrypoint.`,
          `This couples ${sourceNode.path} to internals of ${targetNode.packageName}. If the internal file moves or stops being exported, the importer breaks even though the package boundary may still be intact.`,
          [sourceNode.id, targetNode.id],
          [
            ...edges.map(formatEdgeEvidence),
            {
              label: 'Suggested public entrypoint',
              ...(publicEntrypoints[0] ? { targetPath: publicEntrypoints[0], details: publicEntrypoints[0] } : {})
            }
          ],
          { edgeCount: edges.length }
        )
      );
    }

    const matchingRules = boundaryRules.filter((rule) => {
      const matcher = rule.from.map((pattern) => picomatch(pattern));
      return matcher.some((matches) => matches(sourceNode.path));
    });

    for (const rule of matchingRules) {
      const allowMatchers = rule.allow.map((pattern) => picomatch(pattern));
      const allowed = allowMatchers.some((matches) => matches(targetNode.path));
      if (allowed) {
        continue;
      }

      findings.push(
        createFinding(
          'boundary-violation',
          `Boundary rule "${rule.name}" violated`,
          `${sourceNode.path} imports ${targetNode.path}, which is outside the allowed boundary set for "${rule.name}".`,
          'Configured boundaries are there to keep dependency direction intentional. When a module crosses one, unrelated areas of the codebase start changing together.',
          [sourceNode.id, targetNode.id],
          edges.map(formatEdgeEvidence),
          { rule: rule.name, source: sourceNode.path, target: targetNode.path },
          'high'
        )
      );
    }

    if (differentFeature && bypassesPublicSurface) {
      findings.push(
        createFinding(
          'cross-feature',
          `Cross-feature deep import from ${sourceNode.featureRoot} to ${targetNode.featureRoot}`,
          `${sourceNode.path} depends on internal code inside ${targetNode.featureRoot}.`,
          'This skips the target feature public surface, so a local implementation change inside the target feature can break another feature directly.',
          [sourceNode.id, targetNode.id],
          edges.map(formatEdgeEvidence),
          {
            sourceFeature: sourceNode.featureRoot ?? '',
            targetFeature: targetNode.featureRoot ?? ''
          },
          'high'
        )
      );
    }
  }

  for (const [sourceFeature, entry] of crossFeatureFanout) {
    const targets = [...entry.targetFeatures].sort();
    findings.push(
      createFinding(
        'cross-feature',
        `Cross-feature fan-out from ${sourceFeature}`,
        `${entry.sourceNode.path} depends on ${targets.length} other feature roots.`,
        'When one feature reaches into several peer features, feature ownership blurs and coordinated changes become more likely.',
        [entry.sourceNode.id],
        entry.edges.map(formatEdgeEvidence),
        {
          sourceFeature,
          distinctTargetFeatures: targets.length,
          targets: targets.join(', ')
        },
        severityForCount(targets.length)
      )
    );
  }

  return {
    findings,
    deadExports
  };
}

export function detectHotspotFindings(
  graphs: Record<'file' | 'folder' | 'package', BoundaryAtlasGraph>
): { findings: BoundaryAtlasFinding[]; hotspots: BoundaryAtlasHotspot[] } {
  const hotspots: BoundaryAtlasHotspot[] = [];
  const findings: BoundaryAtlasFinding[] = [];

  for (const graph of [graphs.file, graphs.folder, graphs.package]) {
    for (const node of selectHotspots(graph, graph.granularity)) {
      const rationale = `${node.path} has fan-in ${node.fanIn} and fan-out ${node.fanOut}.`;
      hotspots.push({
        id: `hotspot:${graph.granularity}:${node.path}`,
        granularity: graph.granularity,
        nodeId: node.id,
        label: node.label,
        path: node.path,
        fanIn: node.fanIn,
        fanOut: node.fanOut,
        rationale
      });

      findings.push(
        createFinding(
          'hotspot',
          `${graph.granularity} hotspot: ${node.path}`,
          rationale,
          'High fan-in means many callers depend on this node. High fan-out means this node reaches across many other areas. Either shape concentrates architectural churn.',
          [node.id],
          [{ label: node.path, sourcePath: node.path }],
          {
            granularity: graph.granularity,
            fanIn: node.fanIn,
            fanOut: node.fanOut
          }
        )
      );
    }
  }

  return { findings, hotspots };
}
