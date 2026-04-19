import type { BoundaryAtlasReport } from '../types/report.js';

function section(title: string): string {
  return `## ${title}\n`;
}

const FINDING_TYPE_WEIGHT: Record<BoundaryAtlasReport['findings'][number]['type'], number> = {
  'boundary-violation': 0,
  'cross-feature': 1,
  cycle: 2,
  'deep-import': 3,
  'dead-export': 4,
  hotspot: 5
};

const SEVERITY_WEIGHT: Record<BoundaryAtlasReport['findings'][number]['severity'], number> = {
  high: 0,
  warn: 1,
  info: 2
};

function sortFindings(report: BoundaryAtlasReport): BoundaryAtlasReport['findings'] {
  return report.findings
    .slice()
    .sort((left, right) => {
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

export function renderMarkdownReport(report: BoundaryAtlasReport): string {
  const lines: string[] = [];
  const sortedFindings = sortFindings(report);
  const highSeverityCount = report.findings.filter((finding) => finding.severity === 'high').length;
  const detectorCounts = [
    { label: 'Cycles', count: report.summary.cycleCount },
    { label: 'Deep imports', count: report.summary.deepImportCount },
    { label: 'Boundary violations', count: report.summary.boundaryViolationCount },
    { label: 'Cross-feature dependencies', count: report.summary.crossFeatureCount },
    { label: 'Dead exports', count: report.summary.deadExportCount },
    { label: 'Hotspots', count: report.summary.hotspotCount }
  ].filter((entry) => entry.count > 0);

  lines.push(`# Boundary Atlas: ${report.project.label}`);
  lines.push('');
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Root: ${report.project.rootPath}`);
  if (report.project.analyzedAtRef) {
    lines.push(`- Ref: ${report.project.analyzedAtRef}`);
  }
  lines.push('');
  lines.push(section('Summary'));
  lines.push(`- Files analyzed: ${report.summary.fileCount}`);
  lines.push(`- Folders: ${report.summary.folderCount}`);
  lines.push(`- Packages: ${report.summary.packageCount}`);
  lines.push(`- Internal edges: ${report.summary.internalEdgeCount}`);
  lines.push(`- Cycles: ${report.summary.cycleCount}`);
  lines.push(`- Deep imports: ${report.summary.deepImportCount}`);
  lines.push(`- Dead exports: ${report.summary.deadExportCount}`);
  lines.push(`- Boundary violations: ${report.summary.boundaryViolationCount}`);
  lines.push(`- Cross-feature dependencies: ${report.summary.crossFeatureCount}`);
  lines.push(`- Hotspots: ${report.summary.hotspotCount}`);
  lines.push('');
  lines.push(section('What stands out'));
    lines.push(`- High-severity findings: ${highSeverityCount}`);
  if (detectorCounts.length > 0) {
    lines.push(
      `- Active detectors: ${detectorCounts.map((entry) => `${entry.label} (${entry.count})`).join(', ')}`
    );
  }
  if (sortedFindings.length > 0) {
    lines.push(`- First issue to inspect: ${sortedFindings[0]!.title}`);
  } else {
    lines.push('- First issue to inspect: none');
  }
  lines.push('');
  lines.push(section('Findings'));

  if (sortedFindings.length === 0) {
    lines.push('No findings.');
  } else {
    for (const finding of sortedFindings) {
      lines.push(`### ${finding.title}`);
      lines.push(`- Type: ${finding.type}`);
      lines.push(`- Severity: ${finding.severity}`);
      lines.push(`- Summary: ${finding.summary}`);
      lines.push(`- Why risky: ${finding.whyRisky}`);
      for (const evidence of finding.evidence) {
        const parts = [evidence.label];
        if (evidence.specifier) {
          parts.push(`specifier=${evidence.specifier}`);
        }
        if (evidence.details) {
          parts.push(evidence.details);
        }
        lines.push(`- Evidence: ${parts.join(' | ')}`);
      }
      lines.push('');
    }
  }

  lines.push(section('Hotspots'));
  if (report.hotspots.length === 0) {
    lines.push('No hotspots above threshold.');
  } else {
    for (const hotspot of report.hotspots) {
      lines.push(
        `- ${hotspot.granularity}: ${hotspot.path} (fan-in ${hotspot.fanIn}, fan-out ${hotspot.fanOut})`
      );
    }
  }

  if (report.drift) {
    lines.push('');
    lines.push(section('Drift'));
    lines.push(`- Base ref: ${report.drift.baseRef}`);
    lines.push(`- Head ref: ${report.drift.headRef}`);
    lines.push(`- Added findings: ${report.drift.addedFindings.length}`);
    lines.push(`- Removed findings: ${report.drift.removedFindings.length}`);
    lines.push(`- Hotspot deltas: ${report.drift.hotspotDeltas.length}`);

    if (report.drift.addedFindings.length > 0) {
      lines.push('');
      lines.push('### Added findings');
      for (const finding of report.drift.addedFindings.slice().sort((left, right) => left.title.localeCompare(right.title))) {
        lines.push(`- [${finding.severity}] ${finding.title}`);
      }
    }

    if (report.drift.removedFindings.length > 0) {
      lines.push('');
      lines.push('### Removed findings');
      for (const finding of report.drift.removedFindings.slice().sort((left, right) => left.title.localeCompare(right.title))) {
        lines.push(`- [${finding.severity}] ${finding.title}`);
      }
    }

    if (report.drift.hotspotDeltas.length > 0) {
      lines.push('');
      lines.push('### Hotspot deltas');
      for (const delta of report.drift.hotspotDeltas.slice().sort((left, right) => left.path.localeCompare(right.path))) {
        lines.push(
          `- ${delta.granularity}: ${delta.path} (fan-in ${delta.fanInBefore} -> ${delta.fanInAfter}, fan-out ${delta.fanOutBefore} -> ${delta.fanOutAfter})`
        );
      }
    }
  }

  return `${lines.join('\n').trimEnd()}\n`;
}
