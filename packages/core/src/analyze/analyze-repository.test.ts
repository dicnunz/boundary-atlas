import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeRepository } from './analyze-repository.js';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../..');

function fixturePath(name: string): string {
  return path.join(REPO_ROOT, 'fixtures', name);
}

describe('analyzeRepository', () => {
  it('detects file-level cycles in the cycle fixture', async () => {
    const report = await analyzeRepository({ rootPath: fixturePath('ts-cycle-dashboard') });

    expect(
      report.findings.some(
        (finding) => finding.type === 'cycle' && finding.title.includes('file cycle')
      )
    ).toBe(true);
  });

  it('detects deep imports in the JavaScript storefront fixture', async () => {
    const report = await analyzeRepository({ rootPath: fixturePath('js-deep-import-storefront') });
    const deepImports = report.findings.filter((finding) => finding.type === 'deep-import');

    expect(deepImports.length).toBeGreaterThanOrEqual(3);
    expect(deepImports.some((finding) => finding.title.includes('build-badge'))).toBe(true);
  });

  it('detects dead exports in the reporting fixture', async () => {
    const report = await analyzeRepository({ rootPath: fixturePath('ts-dead-exports-reporting') });
    const names = report.deadExports.map((item) => item.exportName).sort();

    expect(names).toEqual([
      'formatLegacyRiskCallout',
      'formatSeverityLabel',
      'obsoleteMarkdownPreamble'
    ]);
  });

  it('detects cross-feature fan-out in the portal fixture', async () => {
    const report = await analyzeRepository({ rootPath: fixturePath('ts-cross-feature-portal') });

    expect(
      report.findings.some(
        (finding) =>
          finding.type === 'cross-feature' &&
          finding.title.includes('Cross-feature fan-out from src/features/checkout')
      )
    ).toBe(true);
  });

  it('honors configured boundary rules', async () => {
    const rootPath = await mkdtemp(path.join(tmpdir(), 'boundary-atlas-config-'));
    await mkdir(path.join(rootPath, 'src', 'app'), { recursive: true });
    await mkdir(path.join(rootPath, 'src', 'shared'), { recursive: true });

    await writeFile(
      path.join(rootPath, 'src', 'app', 'index.ts'),
      "import { secret } from '../shared/private.js';\nexport const screen = secret;\n",
      'utf8'
    );
    await writeFile(
      path.join(rootPath, 'src', 'shared', 'index.ts'),
      "export const publicToken = 'public';\n",
      'utf8'
    );
    await writeFile(
      path.join(rootPath, 'src', 'shared', 'private.ts'),
      "export const secret = 'secret';\n",
      'utf8'
    );
    await writeFile(
      path.join(rootPath, 'boundary-atlas.config.json'),
      JSON.stringify(
        {
          boundaries: [
            {
              name: 'app-to-shared',
              from: ['src/app/**'],
              allow: ['src/shared/index.ts']
            }
          ]
        },
        null,
        2
      ),
      'utf8'
    );

    const report = await analyzeRepository({ rootPath });
    expect(report.findings.some((finding) => finding.type === 'boundary-violation')).toBe(true);
  });
});
