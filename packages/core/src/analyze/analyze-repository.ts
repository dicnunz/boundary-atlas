import { buildGraphView } from '../graph/aggregate-graphs.js';
import { buildProjectGraph } from '../graph/build-project-graph.js';
import { repoLabelFromRoot } from '../graph/path-utils.js';
import { detectCycleFindings, detectHotspotFindings, detectStructuralFindings } from '../rules/findings.js';
import { loadBoundaryAtlasConfig, type AnalyzeRepositoryOptions } from '../types/config.js';
import type { BoundaryAtlasFinding, BoundaryAtlasReport } from '../types/report.js';

function dedupeFindings(findings: BoundaryAtlasFinding[]): BoundaryAtlasFinding[] {
  const unique = new Map<string, BoundaryAtlasFinding>();
  for (const finding of findings) {
    if (!unique.has(finding.fingerprint)) {
      unique.set(finding.fingerprint, finding);
    }
  }

  const severityWeight: Record<BoundaryAtlasFinding['severity'], number> = {
    high: 0,
    warn: 1,
    info: 2
  };

  return [...unique.values()].sort((left, right) => {
    const severityDelta = severityWeight[left.severity] - severityWeight[right.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }
    return left.title.localeCompare(right.title);
  });
}

export async function analyzeRepository(
  options: AnalyzeRepositoryOptions
): Promise<BoundaryAtlasReport> {
  const { rootPath, configPath, label } = options;
  const loadedConfig = loadBoundaryAtlasConfig(rootPath, configPath);
  const projectGraph = buildProjectGraph(rootPath, loadedConfig.config);

  const graphs = {
    file: buildGraphView(projectGraph, 'file'),
    folder: buildGraphView(projectGraph, 'folder'),
    package: buildGraphView(projectGraph, 'package')
  } satisfies BoundaryAtlasReport['graphs'];

  const structural = detectStructuralFindings(projectGraph);
  const cycles = detectCycleFindings(graphs);
  const hotspots = detectHotspotFindings(graphs);
  const findings = dedupeFindings([
    ...structural.findings,
    ...cycles.findings,
    ...hotspots.findings
  ]);

  return {
    kind: 'analysis',
    version: '1',
    generatedAt: new Date().toISOString(),
    project: {
      label: label ?? repoLabelFromRoot(rootPath),
      rootPath,
      repoName: repoLabelFromRoot(rootPath),
      ...(loadedConfig.path ? { configPath: loadedConfig.path } : {})
    },
    summary: {
      fileCount: graphs.file.nodes.length,
      folderCount: graphs.folder.nodes.length,
      packageCount: graphs.package.nodes.length,
      internalEdgeCount: projectGraph.edges.length,
      cycleCount: cycles.findings.length,
      deepImportCount: findings.filter((finding) => finding.type === 'deep-import').length,
      deadExportCount: structural.deadExports.length,
      boundaryViolationCount: findings.filter((finding) => finding.type === 'boundary-violation').length,
      crossFeatureCount: findings.filter((finding) => finding.type === 'cross-feature').length,
      hotspotCount: hotspots.hotspots.length
    },
    config: loadedConfig.config,
    graphs,
    findings,
    hotspots: hotspots.hotspots,
    deadExports: structural.deadExports,
    publicEntrypoints: [...projectGraph.publicEntrypoints].sort()
  };
}
