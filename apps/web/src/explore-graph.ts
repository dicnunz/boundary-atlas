import type {
  BoundaryAtlasFinding, BoundaryAtlasGraph, BoundaryAtlasGraphNode, BoundaryAtlasGranularity, BoundaryAtlasReport
} from './report-types.js';

export const GRANULARITIES: BoundaryAtlasGranularity[] = ['package', 'folder', 'file'];
export const FINDING_LABELS = {
  'boundary-violation': 'Boundary breaks', 'cross-feature': 'Cross-feature', cycle: 'Cycles',
  'deep-import': 'Deep imports', 'dead-export': 'Dead exports', hotspot: 'Hotspots'
} satisfies Record<BoundaryAtlasFinding['type'], string>;
const SEVERITY_WEIGHT = { high: 0, warn: 1, info: 2 };

export function prioritizeFindings(findings: BoundaryAtlasFinding[]) {
  const types = Object.keys(FINDING_LABELS);
  return findings.slice().sort((left, right) =>
    SEVERITY_WEIGHT[left.severity] - SEVERITY_WEIGHT[right.severity]
    || types.indexOf(left.type) - types.indexOf(right.type)
    || left.title.localeCompare(right.title)
  );
}

export function findNodeGranularity(report: BoundaryAtlasReport, nodeId: string | null) {
  return GRANULARITIES.find((level) => report.graphs[level].nodes.some((node) => node.id === nodeId)) ?? 'file';
}

/** Return an induced graph: every link must retain both endpoints, including specifier search hits. */
export function filterGraph(graph: BoundaryAtlasGraph, query: string, focusIds: readonly string[] | null = null): BoundaryAtlasGraph {
  const normalized = query.trim().toLowerCase();
  const focused = focusIds ? new Set(focusIds) : null;
  const inScope = graph.nodes.filter((node) => !focused || focused.has(node.id));
  const scopeIds = new Set(inScope.map((node) => node.id));
  const scopeEdges = graph.edges.filter((edge) => scopeIds.has(edge.source) && scopeIds.has(edge.target));
  if (!normalized) return { ...graph, nodes: inScope, edges: scopeEdges };

  const matches = new Set(inScope.filter((node) =>
    `${node.label} ${node.path} ${node.packageName ?? ''}`.toLowerCase().includes(normalized)
  ).map((node) => node.id));
  for (const edge of scopeEdges) {
    if (edge.specifiers.some((specifier) => specifier.toLowerCase().includes(normalized))) {
      matches.add(edge.source);
      matches.add(edge.target);
    }
  }
  return {
    ...graph,
    nodes: inScope.filter((node) => matches.has(node.id)),
    edges: scopeEdges.filter((edge) => matches.has(edge.source) && matches.has(edge.target))
  };
}

export function neighborhoodIds(graph: BoundaryAtlasGraph, nodeId: string): string[] {
  const ids = new Set([nodeId]);
  for (const edge of graph.edges) {
    if (edge.source === nodeId) ids.add(edge.target);
    if (edge.target === nodeId) ids.add(edge.source);
  }
  return [...ids];
}

/** Findings may name only the importer in nodeIds; resolve their concrete edge evidence too. */
export function findingNodeIds(graph: BoundaryAtlasGraph, finding: BoundaryAtlasFinding): string[] {
  const ids = new Set(finding.nodeIds);
  const paths = new Set(finding.evidence.flatMap((item) => [item.sourcePath, item.targetPath]).filter((path): path is string => !!path));
  for (const node of graph.nodes) {
    if (paths.has(node.path)) ids.add(node.id);
  }
  if (finding.type === 'hotspot') {
    for (const id of finding.nodeIds) for (const neighbor of neighborhoodIds(graph, id)) ids.add(neighbor);
  }
  return [...ids];
}

export function nodeConnections(graph: BoundaryAtlasGraph, nodeId: string) {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const resolve = (direction: 'source' | 'target') => graph.edges
    .filter((edge) => edge[direction === 'source' ? 'target' : 'source'] === nodeId)
    .map((edge) => ({ edge, node: nodes.get(edge[direction]) as BoundaryAtlasGraphNode }))
    .sort((left, right) => left.node.path.localeCompare(right.node.path));
  return { incoming: resolve('source'), outgoing: resolve('target') };
}
