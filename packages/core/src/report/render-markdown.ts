import type { BoundaryAtlasReport } from '../types/report.js';

function section(title: string): string {
  return `## ${title}\n`;
}

export function renderMarkdownReport(report: BoundaryAtlasReport): string {
  const lines: string[] = [];

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
  lines.push(section('Findings'));

  if (report.findings.length === 0) {
    lines.push('No findings.');
  } else {
    for (const finding of report.findings) {
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
  }

  return `${lines.join('\n').trimEnd()}\n`;
}
