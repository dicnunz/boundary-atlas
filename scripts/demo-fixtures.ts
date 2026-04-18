import path from 'node:path';
import { analyzeRepository } from '../packages/core/src/index.ts';
import { REPO_ROOT, writeReportArtifacts } from './report-export.ts';

const FIXTURES = [
  'ts-cycle-dashboard',
  'js-deep-import-storefront',
  'ts-dead-exports-reporting',
  'ts-cross-feature-portal'
];

for (const fixture of FIXTURES) {
  const rootPath = path.join(REPO_ROOT, 'fixtures', fixture);
  const outputRoot = path.join(REPO_ROOT, 'docs', 'samples', 'fixtures', fixture);
  const report = await analyzeRepository({ rootPath, label: fixture });
  await writeReportArtifacts(report, outputRoot);
  console.log(`exported ${fixture} -> ${path.relative(REPO_ROOT, outputRoot)}`);
}
