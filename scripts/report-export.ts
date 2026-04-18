import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { BoundaryAtlasReport } from '../packages/core/src/types/report.ts';
import { renderMarkdownReport } from '../packages/core/src/index.ts';

export const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const WEB_DIST_DIR = path.join(REPO_ROOT, 'apps/web/dist');

function escapeHtmlInjection(payload: string): string {
  return payload.replaceAll('<', '\\u003c');
}

export async function writeReportArtifacts(
  report: BoundaryAtlasReport,
  outputRoot: string
): Promise<void> {
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  await writeFile(
    path.join(outputRoot, 'report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  await writeFile(path.join(outputRoot, 'report.md'), renderMarkdownReport(report), 'utf8');

  if (!existsSync(path.join(WEB_DIST_DIR, 'index.html'))) {
    throw new Error('Web app build not found. Run `npm run build` before demo exports.');
  }

  const htmlRoot = path.join(outputRoot, 'html');
  await cp(WEB_DIST_DIR, htmlRoot, { recursive: true });

  const indexPath = path.join(htmlRoot, 'index.html');
  const html = await readFile(indexPath, 'utf8');
  const injected = html.replace(
    '</head>',
    `  <script>window.__BOUNDARY_ATLAS_EMBEDDED_REPORT__=${escapeHtmlInjection(
      JSON.stringify(report)
    )};</script>\n</head>`
  );

  await writeFile(indexPath, injected, 'utf8');
  await writeFile(
    path.join(htmlRoot, 'report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
}
