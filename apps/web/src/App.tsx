import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent
} from 'react';
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

interface SummaryCard {
  label: string;
  value: string;
  emphasis?: 'signal' | 'alert';
}

const GRANULARITIES: BoundaryAtlasGranularity[] = ['package', 'folder', 'file'];
const FINDING_TYPE_WEIGHT: Record<BoundaryAtlasFinding['type'], number> = {
  'boundary-violation': 0,
  'cross-feature': 1,
  cycle: 2,
  'deep-import': 3,
  'dead-export': 4,
  hotspot: 5
};
const SEVERITY_WEIGHT: Record<BoundaryAtlasFinding['severity'], number> = {
  high: 0,
  warn: 1,
  info: 2
};

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

function prioritizeFindings(findings: BoundaryAtlasFinding[]): BoundaryAtlasFinding[] {
  return findings.slice().sort((left, right) => {
    const severityDelta = SEVERITY_WEIGHT[left.severity] - SEVERITY_WEIGHT[right.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }

    const typeDelta = FINDING_TYPE_WEIGHT[left.type] - FINDING_TYPE_WEIGHT[right.type];
    if (typeDelta !== 0) {
      return typeDelta;
    }

    return left.title.localeCompare(right.title);
  });
}

function pickFeaturedFinding(report: BoundaryAtlasReport): BoundaryAtlasFinding | null {
  return prioritizeFindings(report.findings)[0] ?? null;
}

function pickInitialGranularity(
  report: BoundaryAtlasReport,
  featuredFinding: BoundaryAtlasFinding | null
): BoundaryAtlasGranularity {
  const featuredNodeId = featuredFinding?.nodeIds[0];
  if (featuredNodeId) {
    return inferGranularity(featuredNodeId);
  }

  if (report.graphs.file.nodes.length > 1 && report.graphs.file.nodes.length <= 48) {
    return 'file';
  }

  if (report.graphs.folder.nodes.length > 1) {
    return 'folder';
  }

  return 'package';
}

export function App() {
  const [report, setReport] = useState<BoundaryAtlasReport | null>(null);
  const [status, setStatus] = useState('Loading demo report...');
  const [granularity, setGranularity] = useState<BoundaryAtlasGranularity>('file');
  const [search, setSearch] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const applyReport = useCallback((nextReport: BoundaryAtlasReport, nextStatus: string) => {
    const featuredFinding = pickFeaturedFinding(nextReport);
    const featuredNodeId = featuredFinding?.nodeIds[0] ?? null;

    startTransition(() => {
      setReport(nextReport);
      setStatus(nextStatus);
      setSearch('');
      setSelectedFindingId(featuredFinding?.id ?? null);
      setSelectedNodeId(featuredNodeId);
      setGranularity(pickInitialGranularity(nextReport, featuredFinding));
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadReport = async () => {
      if (window.__BOUNDARY_ATLAS_EMBEDDED_REPORT__) {
        if (!cancelled) {
          applyReport(window.__BOUNDARY_ATLAS_EMBEDDED_REPORT__, 'Loaded embedded report.');
        }
        return;
      }

      try {
        const response = await fetch('./demo-report.json');
        if (!response.ok) {
          throw new Error(`Demo report missing (${response.status})`);
        }

        const nextReport = (await response.json()) as BoundaryAtlasReport;
        if (!cancelled) {
          applyReport(nextReport, 'Loaded demo report.');
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
  }, [applyReport]);

  const prioritizedFindings = useMemo(() => prioritizeFindings(report?.findings ?? []), [report]);
  const activeGraph = report?.graphs[granularity];
  const selectedFinding = prioritizedFindings.find((finding) => finding.id === selectedFindingId) ?? null;
  const selectedNode = activeGraph?.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const highSeverityCount = report?.findings.filter((finding) => finding.severity === 'high').length ?? 0;
  const detectorCards = report
    ? [
        { label: 'Cycles', count: report.summary.cycleCount },
        { label: 'Deep imports', count: report.summary.deepImportCount },
        { label: 'Boundary breaks', count: report.summary.boundaryViolationCount },
        { label: 'Cross-feature', count: report.summary.crossFeatureCount },
        { label: 'Dead exports', count: report.summary.deadExportCount },
        { label: 'Hotspots', count: report.summary.hotspotCount }
      ]
        .filter((entry) => entry.count > 0)
        .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
        .slice(0, 2)
    : [];

  const filteredFindings = prioritizedFindings.filter((finding) => {
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
  });

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

  const summaryCards: SummaryCard[] = report
    ? [
        { label: 'Files', value: String(report.summary.fileCount) },
        { label: 'Edges', value: String(report.summary.internalEdgeCount) },
        { label: 'Findings', value: String(report.findings.length), emphasis: 'signal' },
        {
          label: 'High severity',
          value: String(highSeverityCount),
          ...(highSeverityCount > 0 ? { emphasis: 'alert' as const } : {})
        },
        ...detectorCards.map((entry) => ({
          label: entry.label,
          value: String(entry.count),
          emphasis: 'signal' as const
        }))
      ]
    : [];

  const handleFileLoad = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const nextReport = JSON.parse(text) as BoundaryAtlasReport;
    applyReport(nextReport, `Loaded ${file.name}.`);
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
          <h1>Architecture radar for TypeScript and JavaScript repos.</h1>
          <p className="atlas-copy">
            Evidence-backed cycles, deep imports, boundary breaks, hotspots, dead exports, and git drift in an
            offline viewer you can ship with the report.
          </p>
          <p className="atlas-subcopy">
            Demo state opens a cross-feature fan-out finding first so the viewer shows the risk, not just the shell.
          </p>
        </div>
        <div className="atlas-actions">
          <label className="upload-pill">
            Load report JSON
            <input type="file" accept=".json" onChange={handleFileLoad} />
          </label>
          <p className="status-pill">{status}</p>
        </div>
      </header>

      <section className="summary-strip">
        {summaryCards.map((card) => (
          <article
            className={`summary-card${card.emphasis ? ` is-${card.emphasis}` : ''}`}
            key={`${card.label}-${card.value}`}
          >
            <span>{card.label}</span>
            <strong>{card.value}</strong>
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
                placeholder="Search paths, findings, specifiers"
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
                <span className={`severity-chip severity-${selectedFinding.severity}`}>{selectedFinding.severity}</span>
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
                    <dt>Kind</dt>
                    <dd>{selectedNode.kind}</dd>
                  </div>
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
                  <div>
                    <dt>Public entrypoint</dt>
                    <dd>{selectedNode.isPublicEntrypoint ? 'yes' : 'no'}</dd>
                  </div>
                </dl>
              </div>
            ) : report ? (
              <div className="node-card">
                <h3>{report.project.label}</h3>
                <ul className="overview-list">
                  <li>{report.findings.length} prioritized findings across file, folder, and package graphs.</li>
                  <li>
                    {highSeverityCount > 0
                      ? `${highSeverityCount} high-severity finding${highSeverityCount === 1 ? '' : 's'} should be triaged first.`
                      : 'No high-severity findings in this report.'}
                  </li>
                  <li>
                    {report.drift
                      ? `Diff report comparing ${report.drift.baseRef} to ${report.drift.headRef}.`
                      : 'Select a finding to jump from the summary into the exact edges behind it.'}
                  </li>
                </ul>
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
