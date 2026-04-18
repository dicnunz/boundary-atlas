import { startTransition, useDeferredValue, useEffect, useState, type ChangeEvent } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type {
  BoundaryAtlasFinding,
  BoundaryAtlasGranularity,
  BoundaryAtlasGraphEdge,
  BoundaryAtlasGraphNode,
  BoundaryAtlasReport
} from './report-types.js';

declare global {
  interface Window {
    __BOUNDARY_ATLAS_EMBEDDED_REPORT__?: BoundaryAtlasReport;
  }
}

interface GraphNodeDatum extends BoundaryAtlasGraphNode {
  color: string;
  radius: number;
  labelText: string;
  x?: number;
  y?: number;
}

interface GraphEdgeDatum extends BoundaryAtlasGraphEdge {
  color: string;
  width: number;
}

const GRANULARITIES: BoundaryAtlasGranularity[] = ['package', 'folder', 'file'];

function hashColor(value: string): string {
  let hash = 0;
  for (const character of value) {
    hash = (hash << 5) - hash + character.charCodeAt(0);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 68% 58%)`;
}

function inferGranularity(nodeId: string | undefined): BoundaryAtlasGranularity {
  if (!nodeId) {
    return 'package';
  }

  if (nodeId.startsWith('file:')) {
    return 'file';
  }

  if (nodeId.startsWith('folder:')) {
    return 'folder';
  }

  return 'package';
}

function matchesSearch(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase());
}

export function App() {
  const [report, setReport] = useState<BoundaryAtlasReport | null>(null);
  const [status, setStatus] = useState('Loading demo report...');
  const [granularity, setGranularity] = useState<BoundaryAtlasGranularity>('package');
  const [search, setSearch] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let cancelled = false;

    const loadReport = async () => {
      if (window.__BOUNDARY_ATLAS_EMBEDDED_REPORT__) {
        setReport(window.__BOUNDARY_ATLAS_EMBEDDED_REPORT__);
        setStatus('Loaded embedded report.');
        return;
      }

      try {
        const response = await fetch('./demo-report.json');
        if (!response.ok) {
          throw new Error(`Demo report missing (${response.status})`);
        }

        const nextReport = (await response.json()) as BoundaryAtlasReport;
        if (!cancelled) {
          setReport(nextReport);
          setStatus('Loaded demo report.');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : String(error));
        }
      }
    };

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeGraph = report?.graphs[granularity];
  const selectedFinding =
    report?.findings.find((finding) => finding.id === selectedFindingId) ?? null;
  const selectedNode =
    activeGraph?.nodes.find((node) => node.id === selectedNodeId) ?? null;

  const filteredFindings =
    report?.findings.filter((finding) => {
      if (deferredSearch.trim() === '') {
        return true;
      }

      const haystack = [
        finding.title,
        finding.summary,
        finding.type,
        ...finding.evidence.map((item) => item.label),
        ...finding.evidence.flatMap((item) => [item.sourcePath ?? '', item.targetPath ?? ''])
      ].join(' ');

      return matchesSearch(haystack, deferredSearch);
    }) ?? [];

  const selectedFindingNodes = new Set(selectedFinding?.nodeIds ?? []);

  const graphData = {
    nodes:
      activeGraph?.nodes
        .filter((node) => {
          if (deferredSearch.trim() === '') {
            return true;
          }

          return matchesSearch(`${node.label} ${node.path} ${node.packageName ?? ''}`, deferredSearch);
        })
        .map((node) => {
          const highlighted = node.id === selectedNodeId || selectedFindingNodes.has(node.id);
          return {
            ...node,
            color:
              highlighted
                ? '#ffd166'
                : node.packageName
                  ? hashColor(node.packageName)
                  : '#77d0ff',
            radius: highlighted ? 8 : Math.max(4, Math.min(10, 4 + node.fanIn + node.fanOut)),
            labelText: node.label
          } satisfies GraphNodeDatum;
        }) ?? [],
    links:
      activeGraph?.edges
        .filter((edge) => {
          if (deferredSearch.trim() === '') {
            return true;
          }

          return matchesSearch(`${edge.source} ${edge.target} ${edge.specifiers.join(' ')}`, deferredSearch);
        })
        .map((edge) => ({
          ...edge,
          color:
            selectedFindingNodes.has(edge.source) && selectedFindingNodes.has(edge.target)
              ? '#ffd166'
              : 'rgba(124, 188, 255, 0.32)',
          width: selectedFindingNodes.has(edge.source) && selectedFindingNodes.has(edge.target) ? 2.4 : 1
        }) satisfies GraphEdgeDatum) ?? []
  };

  const summaryCards = report
    ? [
        ['Files', String(report.summary.fileCount)],
        ['Packages', String(report.summary.packageCount)],
        ['Edges', String(report.summary.internalEdgeCount)],
        ['Findings', String(report.findings.length)]
      ]
    : [];

  const handleFileLoad = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const nextReport = JSON.parse(text) as BoundaryAtlasReport;
    startTransition(() => {
      setReport(nextReport);
      setSelectedFindingId(null);
      setSelectedNodeId(null);
      setStatus(`Loaded ${file.name}.`);
    });
  };

  const focusFinding = (finding: BoundaryAtlasFinding) => {
    startTransition(() => {
      setSelectedFindingId(finding.id);
      const nextNodeId = finding.nodeIds[0] ?? null;
      setSelectedNodeId(nextNodeId);
      setGranularity(inferGranularity(nextNodeId ?? undefined));
    });
  };

  return (
    <main className="atlas-shell">
      <header className="atlas-header">
        <div className="hero-copy">
          <img className="atlas-mark" src="./mark.svg" alt="Boundary Atlas mark" />
          <p className="atlas-kicker">Boundary Atlas</p>
          <h1>Architecture radar for TypeScript codebases.</h1>
          <p className="atlas-copy">
            Interactive boundary analysis with evidence-backed cycles, deep imports,
            hotspots, dead exports, and git drift.
          </p>
        </div>
        <div className="atlas-actions">
          <label className="upload-pill">
            Load report
            <input type="file" accept=".json" onChange={handleFileLoad} />
          </label>
          <p className="status-pill">{status}</p>
        </div>
      </header>

      <section className="summary-strip">
        {summaryCards.map(([label, value]) => (
          <article className="summary-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="workspace-grid">
        <section className="graph-panel">
          <div className="panel-header">
            <div>
              <p className="panel-label">Graph</p>
              <h2>{granularity[0]!.toUpperCase() + granularity.slice(1)} view</h2>
            </div>
            <div className="control-row">
              <div className="granularity-toggle" role="tablist" aria-label="Graph granularity">
                {GRANULARITIES.map((entry) => (
                  <button
                    type="button"
                    key={entry}
                    className={entry === granularity ? 'is-active' : ''}
                    onClick={() => setGranularity(entry)}
                  >
                    {entry}
                  </button>
                ))}
              </div>
              <input
                className="search-input"
                placeholder="Search paths, findings, packages"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="graph-frame">
            {report && activeGraph ? (
              <ForceGraph2D
                graphData={graphData}
                cooldownTicks={120}
                nodeRelSize={6}
                linkColor={(edge) => (edge as GraphEdgeDatum).color}
                linkWidth={(edge) => (edge as GraphEdgeDatum).width}
                onNodeClick={(node) => {
                  const current = node as GraphNodeDatum;
                  setSelectedNodeId(current.id);
                  setSelectedFindingId(null);
                }}
                nodeCanvasObject={(node, context, scale) => {
                  const current = node as GraphNodeDatum;
                  const fontSize = Math.max(9, 14 / scale);
                  context.beginPath();
                  context.fillStyle = current.color;
                  context.arc(current.x ?? 0, current.y ?? 0, current.radius, 0, 2 * Math.PI, false);
                  context.fill();

                  context.font = `${fontSize}px Menlo, "SF Mono", monospace`;
                  context.fillStyle = 'rgba(244, 245, 247, 0.92)';
                  context.fillText(
                    current.labelText,
                    (current.x ?? 0) + current.radius + 4,
                    (current.y ?? 0) + fontSize / 2
                  );
                }}
              />
            ) : (
              <div className="empty-state">
                <p>No report loaded yet.</p>
              </div>
            )}
          </div>
        </section>

        <section className="inspector-column">
          <article className="inspector-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Inspector</p>
                <h2>{selectedFinding ? 'Finding detail' : selectedNode ? 'Node detail' : 'Report overview'}</h2>
              </div>
            </div>

            {selectedFinding ? (
              <div className="finding-card">
                <span className={`severity-chip severity-${selectedFinding.severity}`}>
                  {selectedFinding.severity}
                </span>
                <h3>{selectedFinding.title}</h3>
                <p>{selectedFinding.summary}</p>
                <p className="why-risky">{selectedFinding.whyRisky}</p>
                <ul className="evidence-list">
                  {selectedFinding.evidence.map((item, index) => (
                    <li key={`${item.label}-${index}`}>
                      <strong>{item.label}</strong>
                      <span>{[item.sourcePath, item.targetPath, item.specifier, item.details].filter(Boolean).join(' | ')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : selectedNode ? (
              <div className="node-card">
                <h3>{selectedNode.path}</h3>
                <dl>
                  <div>
                    <dt>Fan-in</dt>
                    <dd>{selectedNode.fanIn}</dd>
                  </div>
                  <div>
                    <dt>Fan-out</dt>
                    <dd>{selectedNode.fanOut}</dd>
                  </div>
                  <div>
                    <dt>Package</dt>
                    <dd>{selectedNode.packageName ?? 'n/a'}</dd>
                  </div>
                  <div>
                    <dt>Feature</dt>
                    <dd>{selectedNode.featureRoot ?? 'n/a'}</dd>
                  </div>
                </dl>
              </div>
            ) : report ? (
              <div className="node-card">
                <h3>{report.project.label}</h3>
                <p>{report.findings.length} findings with graph views at file, folder, and package scope.</p>
                {report.drift ? (
                  <p>
                    Drift mode comparing {report.drift.baseRef} to {report.drift.headRef}.
                  </p>
                ) : null}
              </div>
            ) : null}
          </article>

          <article className="inspector-panel finding-list-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Findings</p>
                <h2>{filteredFindings.length} visible</h2>
              </div>
            </div>
            <div className="finding-list">
              {filteredFindings.map((finding) => (
                <button
                  type="button"
                  key={finding.id}
                  className={finding.id === selectedFindingId ? 'finding-row is-active' : 'finding-row'}
                  onClick={() => focusFinding(finding)}
                >
                  <span className={`severity-chip severity-${finding.severity}`}>{finding.type}</span>
                  <strong>{finding.title}</strong>
                  <p>{finding.summary}</p>
                </button>
              ))}
            </div>
          </article>

          {report?.drift ? (
            <article className="inspector-panel">
              <div className="panel-header">
                <div>
                  <p className="panel-label">Drift</p>
                  <h2>
                    {report.drift.baseRef}
                    {' -> '}
                    {report.drift.headRef}
                  </h2>
                </div>
              </div>
              <div className="drift-grid">
                <div>
                  <span>Added findings</span>
                  <strong>{report.drift.addedFindings.length}</strong>
                </div>
                <div>
                  <span>Removed findings</span>
                  <strong>{report.drift.removedFindings.length}</strong>
                </div>
                <div>
                  <span>Hotspot deltas</span>
                  <strong>{report.drift.hotspotDeltas.length}</strong>
                </div>
              </div>
            </article>
          ) : null}
        </section>
      </section>
    </main>
  );
}
