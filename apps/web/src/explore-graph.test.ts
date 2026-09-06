import { describe, expect, it } from 'vitest';
import { filterGraph, findingNodeIds, neighborhoodIds, nodeConnections } from './explore-graph.js';
import type { BoundaryAtlasFinding, BoundaryAtlasGraph } from './report-types.js';

const graph: BoundaryAtlasGraph = {
  granularity: 'file',
  nodes: ['consumer', 'api', 'storage', 'isolated'].map((id) => ({ id, kind: 'file', path: `src/${id}.ts`, label: `${id}.ts`, fanIn: 0, fanOut: 0 })),
  edges: [
    { id: 'consumer-api', source: 'consumer', target: 'api', kind: 'import', importCount: 2, specifiers: ['@app/public'] },
    { id: 'api-storage', source: 'api', target: 'storage', kind: 'reexport', importCount: 1, specifiers: ['./storage.js'] }
  ]
};

describe('graph exploration', () => {
  it('retains only links with both endpoints when a path search isolates one node', () => {
    const result = filterGraph(graph, ' consumer ');
    expect(result.nodes.map((node) => node.id)).toEqual(['consumer']);
    expect(result.edges).toEqual([]);
  });

  it('includes both endpoints of a matching import specifier', () => {
    const result = filterGraph(graph, '@APP/PUBLIC');
    expect(result.nodes.map((node) => node.id)).toEqual(['consumer', 'api']);
    expect(result.edges.map((edge) => edge.id)).toEqual(['consumer-api']);
  });

  it('returns an empty graph for unmatched queries and keeps isolated nodes for blank queries', () => {
    expect(filterGraph(graph, 'missing')).toMatchObject({ nodes: [], edges: [] });
    expect(filterGraph(graph, '  ')).toEqual(graph);
  });

  it('scopes searches to the focused nodes without leaking matching edges outside the scope', () => {
    expect(filterGraph(graph, '', ['consumer', 'api']).edges.map((edge) => edge.id)).toEqual(['consumer-api']);
    expect(filterGraph(graph, 'storage', ['consumer', 'api'])).toMatchObject({ nodes: [], edges: [] });
  });

  it('finds direct incoming and outgoing neighbors without including transitive dependencies', () => {
    expect(neighborhoodIds(graph, 'consumer')).toEqual(['consumer', 'api']);
    expect(neighborhoodIds(graph, 'api')).toEqual(['api', 'consumer', 'storage']);
    expect(neighborhoodIds(graph, 'isolated')).toEqual(['isolated']);
  });

  it('resolves target paths from finding evidence when nodeIds only names the importer', () => {
    const finding: BoundaryAtlasFinding = {
      id: 'finding:cross-feature', fingerprint: 'cross-feature', type: 'cross-feature', severity: 'warn',
      title: 'Cross-feature dependency', summary: 'api imports storage', whyRisky: 'Crosses a feature boundary.',
      nodeIds: ['api'], evidence: [{ label: 'api → storage', sourcePath: 'src/api.ts', targetPath: 'src/storage.ts' }]
    };
    const result = filterGraph(graph, '', findingNodeIds(graph, finding));
    expect(result.nodes.map((node) => node.id)).toEqual(['api', 'storage']);
    expect(result.edges.map((edge) => edge.id)).toEqual(['api-storage']);
  });

  it('preserves edge direction, kind, specifiers and statement counts for the inspector', () => {
    const result = nodeConnections(graph, 'api');
    expect(result.incoming[0]?.node.id).toBe('consumer');
    expect(result.incoming[0]?.edge).toMatchObject({ kind: 'import', importCount: 2, specifiers: ['@app/public'] });
    expect(result.outgoing[0]?.node.id).toBe('storage');
    expect(result.outgoing[0]?.edge.kind).toBe('reexport');
  });

  it('leaves the input graph unchanged across repeated filters and navigation', () => {
    const before = JSON.stringify(graph);
    filterGraph(graph, 'api');
    nodeConnections(graph, 'api');
    neighborhoodIds(graph, 'api');
    expect(JSON.stringify(graph)).toBe(before);
  });
});
