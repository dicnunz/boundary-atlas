import type {
  BoundaryAtlasGranularity,
  BoundaryAtlasGraph,
  BoundaryAtlasGraphNode
} from '../types/report.js';

export interface DetectedCycle {
  id: string;
  granularity: BoundaryAtlasGranularity;
  nodeIds: string[];
}

export function detectCycles(graph: BoundaryAtlasGraph): DetectedCycle[] {
  const adjacency = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of graph.edges) {
    const current = adjacency.get(edge.source);
    current?.push(edge.target);
  }

  const stack: string[] = [];
  const onStack = new Set<string>();
  const indexMap = new Map<string, number>();
  const lowLink = new Map<string, number>();
  const cycles: DetectedCycle[] = [];
  let index = 0;

  const visit = (nodeId: string) => {
    indexMap.set(nodeId, index);
    lowLink.set(nodeId, index);
    index += 1;
    stack.push(nodeId);
    onStack.add(nodeId);

    for (const neighbor of adjacency.get(nodeId) ?? []) {
      if (!indexMap.has(neighbor)) {
        visit(neighbor);
        lowLink.set(nodeId, Math.min(lowLink.get(nodeId) ?? 0, lowLink.get(neighbor) ?? 0));
      } else if (onStack.has(neighbor)) {
        lowLink.set(nodeId, Math.min(lowLink.get(nodeId) ?? 0, indexMap.get(neighbor) ?? 0));
      }
    }

    if ((lowLink.get(nodeId) ?? -1) !== (indexMap.get(nodeId) ?? -2)) {
      return;
    }

    const component: string[] = [];
    while (stack.length > 0) {
      const current = stack.pop()!;
      onStack.delete(current);
      component.push(current);
      if (current === nodeId) {
        break;
      }
    }

    const hasSelfLoop = (adjacency.get(nodeId) ?? []).includes(nodeId);
    if (component.length > 1 || hasSelfLoop) {
      cycles.push({
        id: `cycle:${graph.granularity}:${component.slice().sort().join('>')}`,
        granularity: graph.granularity,
        nodeIds: component.sort()
      });
    }
  };

  for (const node of graph.nodes) {
    if (!indexMap.has(node.id)) {
      visit(node.id);
    }
  }

  return cycles.sort((left, right) => left.id.localeCompare(right.id));
}

export function selectHotspots(
  graph: BoundaryAtlasGraph,
  granularity: BoundaryAtlasGranularity
): BoundaryAtlasGraphNode[] {
  return graph.nodes
    .filter((node) => node.fanIn >= 3 || node.fanOut >= 3)
    .sort((left, right) => {
      const rightWeight = Math.max(right.fanIn, right.fanOut);
      const leftWeight = Math.max(left.fanIn, left.fanOut);
      if (rightWeight !== leftWeight) {
        return rightWeight - leftWeight;
      }
      return left.path.localeCompare(right.path);
    })
    .slice(0, granularity === 'file' ? 12 : 8);
}
