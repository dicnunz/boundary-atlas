import type {
  BoundaryAtlasGranularity,
  BoundaryAtlasGraph,
  BoundaryAtlasGraphEdge,
  BoundaryAtlasGraphNode
} from '../types/report.js';
import type { ProjectGraphData, SourceNodeRecord } from './workspace.js';

type MutableGraphNode = BoundaryAtlasGraphNode;

function createAggregateNode(
  granularity: BoundaryAtlasGranularity,
  record: SourceNodeRecord
): MutableGraphNode {
  if (granularity === 'file') {
    return {
      id: record.id,
      kind: 'file',
      label: record.label,
      path: record.path,
      packageName: record.packageName,
      featureRoot: record.featureRoot,
      isPublicEntrypoint: record.isPublicEntrypoint,
      fanIn: 0,
      fanOut: 0
    };
  }

  if (granularity === 'folder') {
    return {
      id: `folder:${record.folderPath}`,
      kind: 'folder',
      label: record.folderPath === '.' ? '.' : record.folderPath.split('/').at(-1) ?? record.folderPath,
      path: record.folderPath,
      packageName: record.packageName,
      featureRoot: record.featureRoot,
      fanIn: 0,
      fanOut: 0
    };
  }

  return {
    id: `package:${record.packageName}`,
    kind: 'package',
    label: record.packageName,
    path: record.packageId,
    packageName: record.packageName,
    fanIn: 0,
    fanOut: 0
  };
}

function resolveNodeId(granularity: BoundaryAtlasGranularity, record: SourceNodeRecord): string {
  switch (granularity) {
    case 'file':
      return record.id;
    case 'folder':
      return `folder:${record.folderPath}`;
    case 'package':
      return `package:${record.packageName}`;
  }
}

export function buildGraphView(
  projectGraph: ProjectGraphData,
  granularity: BoundaryAtlasGranularity
): BoundaryAtlasGraph {
  const nodes = new Map<string, MutableGraphNode>();
  const edges = new Map<string, BoundaryAtlasGraphEdge>();

  for (const record of projectGraph.nodes.values()) {
    const nodeId = resolveNodeId(granularity, record);
    if (!nodes.has(nodeId)) {
      nodes.set(nodeId, createAggregateNode(granularity, record));
    }
  }

  for (const edge of projectGraph.edges) {
    const sourceRecord = projectGraph.nodes.get(edge.sourcePath);
    const targetRecord = projectGraph.nodes.get(edge.targetPath);
    if (!sourceRecord || !targetRecord) {
      continue;
    }

    const source = resolveNodeId(granularity, sourceRecord);
    const target = resolveNodeId(granularity, targetRecord);
    if (source === target) {
      continue;
    }

    const edgeId = `${source}->${target}:${edge.kind}`;
    const existingEdge = edges.get(edgeId);
    if (existingEdge) {
      existingEdge.importCount += 1;
      if (!existingEdge.specifiers.includes(edge.specifier)) {
        existingEdge.specifiers.push(edge.specifier);
      }
      continue;
    }

    edges.set(edgeId, {
      id: edgeId,
      source,
      target,
      kind: edge.kind,
      importCount: 1,
      specifiers: edge.specifier === '' ? [] : [edge.specifier]
    });
  }

  for (const edge of edges.values()) {
    const sourceNode = nodes.get(edge.source);
    const targetNode = nodes.get(edge.target);
    if (!sourceNode || !targetNode) {
      continue;
    }

    sourceNode.fanOut += 1;
    targetNode.fanIn += 1;
  }

  return {
    granularity,
    nodes: [...nodes.values()].sort((left, right) => left.path.localeCompare(right.path)),
    edges: [...edges.values()].sort((left, right) => left.id.localeCompare(right.id))
  };
}
