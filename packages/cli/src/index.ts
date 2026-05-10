#!/usr/bin/env node

import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import {
  analyzeRepository,
  compareGitRefs,
  renderMarkdownReport,
  type BoundaryAtlasReport
} from '@boundary-atlas/core';

interface OutputOptions {
  config?: string;
  json?: string;
  markdown?: string;
  html?: string;
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

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(CURRENT_DIR, '../../..');
const WEB_DIST_DIR = path.join(REPO_ROOT, 'apps/web/dist');
const VERSION = '0.1.3';
const SUPPORT_RECEIPT_URL = 'https://nicdunz.gumroad.com/l/smrimu';
const BROWSER_OPERATOR_OS_URL = 'https://nicdunz.gumroad.com/l/agent-browser-operator-os';
const MINI_AUDIT_URL = 'https://nicdunz.gumroad.com/l/agent-workflow-mini-audit';
const WORKFLOW_AUDIT_URL = 'https://nicdunz.gumroad.com/l/agent-workflow-audit';

async function ensureParentDirectory(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
}

function escapeHtmlInjection(payload: string): string {
  return payload.replaceAll('<', '\\u003c');
}

async function exportHtmlReport(report: BoundaryAtlasReport, targetDir: string): Promise<void> {
  if (!existsSync(path.join(WEB_DIST_DIR, 'index.html'))) {
    throw new Error('Web app build not found. Run `npm run build -w @boundary-atlas/web` first.');
  }

  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
  await cp(WEB_DIST_DIR, targetDir, { recursive: true });

  const indexPath = path.join(targetDir, 'index.html');
  const html = await readFile(indexPath, 'utf8');
  const payload = escapeHtmlInjection(JSON.stringify(report));
  const injected = html.replace(
    '</head>',
    `  <script>window.__BOUNDARY_ATLAS_EMBEDDED_REPORT__=${payload};</script>\n</head>`
  );
  await writeFile(indexPath, injected, 'utf8');
  await writeFile(path.join(targetDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

async function writeOutputs(report: BoundaryAtlasReport, options: OutputOptions): Promise<void> {
  if (options.json) {
    const jsonPath = path.resolve(options.json);
    await ensureParentDirectory(jsonPath);
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  if (options.markdown) {
    const markdownPath = path.resolve(options.markdown);
    await ensureParentDirectory(markdownPath);
    await writeFile(markdownPath, renderMarkdownReport(report), 'utf8');
  }

  if (options.html) {
    await exportHtmlReport(report, path.resolve(options.html));
  }
}

function printSummary(report: BoundaryAtlasReport): void {
  const highSeverityCount = report.findings.filter((finding) => finding.severity === 'high').length;
  const sortedFindings = report.findings
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

  const detectorCounts = [
    { label: 'cycles', count: report.summary.cycleCount },
    { label: 'deep imports', count: report.summary.deepImportCount },
    { label: 'boundary breaks', count: report.summary.boundaryViolationCount },
    { label: 'cross-feature edges', count: report.summary.crossFeatureCount },
    { label: 'dead exports', count: report.summary.deadExportCount },
    { label: 'hotspots', count: report.summary.hotspotCount }
  ].filter((entry) => entry.count > 0);

  console.log(`Boundary Atlas: ${report.project.label}`);
  console.log(`Files: ${report.summary.fileCount}`);
  console.log(`Packages: ${report.summary.packageCount}`);
  console.log(`Edges: ${report.summary.internalEdgeCount}`);
  console.log(`Findings: ${report.findings.length}`);
  console.log(`High severity: ${highSeverityCount}`);

  if (detectorCounts.length > 0) {
    console.log('');
    console.log('Signals:');
    for (const entry of detectorCounts) {
      console.log(`- ${entry.label}: ${entry.count}`);
    }
  }

  const topFindings = sortedFindings.slice(0, 5);
  if (topFindings.length > 0) {
    console.log('');
    console.log('Top findings:');
    for (const finding of topFindings) {
      console.log(`- [${finding.severity}][${finding.type}] ${finding.title}`);
    }
  }
}

async function runAnalyze(target: string | undefined, options: OutputOptions): Promise<void> {
  const rootPath = path.resolve(target ?? '.');
  const report = await analyzeRepository({
    rootPath,
    ...(options.config ? { configPath: options.config } : {})
  });
  await writeOutputs(report, options);
  printSummary(report);
}

async function runDiff(
  target: string | undefined,
  options: OutputOptions & { base: string; head: string }
): Promise<void> {
  const rootPath = path.resolve(target ?? '.');
  const report = await compareGitRefs({
    rootPath,
    baseRef: options.base,
    headRef: options.head,
    ...(options.config ? { configPath: options.config } : {})
  });
  await writeOutputs(report, options);
  printSummary(report);
}

const program = new Command();

program
  .name('boundary-atlas')
  .description('Architecture radar for TypeScript and JavaScript repositories.')
  .version(VERSION);

program
  .command('support')
  .description('Show the optional support receipt link.')
  .action(() => {
    console.log('Support Boundary Atlas:');
    console.log(`- Optional $5 Codex run receipt: ${SUPPORT_RECEIPT_URL}`);
    console.log(`- Agent Browser Operator OS for self-serve approval lanes, proof, and handoffs: ${BROWSER_OPERATOR_OS_URL}`);
    console.log(`- Mini audit for a redacted Boundary Atlas report or public TS/JS repo: ${MINI_AUDIT_URL}`);
    console.log(`- Full workflow audit for architecture drift review: ${WORKFLOW_AUDIT_URL}`);
    console.log('- Redacted reports and public repo links only. No private source, secrets, credentials, production data, or call required.');
    console.log('- Browser operator kit is self-serve material only: no Chrome plugin repair, guaranteed automation, account access, custom setup, or calls.');
    console.log('- Use it if the architecture report saved review or refactor time.');
  });

program
  .command('analyze [target]')
  .description('Analyze a repository working tree and emit an architecture report.')
  .option('--config <path>', 'path to boundary-atlas.config.json')
  .option('--json <path>', 'write a JSON report')
  .option('--markdown <path>', 'write a Markdown report')
  .option('--html <dir>', 'write an offline HTML report directory')
  .action((target, options) => {
    void runAnalyze(target, options).catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
  });

program
  .command('diff [target]')
  .description('Compare two git refs and emit an architecture drift report.')
  .requiredOption('--base <ref>', 'base git ref')
  .requiredOption('--head <ref>', 'head git ref')
  .option('--config <path>', 'path to boundary-atlas.config.json')
  .option('--json <path>', 'write a JSON report')
  .option('--markdown <path>', 'write a Markdown report')
  .option('--html <dir>', 'write an offline HTML report directory')
  .action((target, options) => {
    void runDiff(target, options).catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
  });

program.parse();
