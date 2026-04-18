import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { compareGitRefs } from './compare-git-refs.js';

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

describe('compareGitRefs', () => {
  it('reports newly introduced cycles between refs', async () => {
    const rootPath = await mkdtemp(path.join(tmpdir(), 'boundary-atlas-diff-'));
    await mkdir(path.join(rootPath, 'src'), { recursive: true });

    git(rootPath, 'init', '-b', 'main');
    git(rootPath, 'config', 'user.email', 'boundary-atlas@example.com');
    git(rootPath, 'config', 'user.name', 'Boundary Atlas');

    await writeFile(
      path.join(rootPath, 'src', 'a.ts'),
      "import { b } from './b.js';\nexport const a = b + 1;\n",
      'utf8'
    );
    await writeFile(path.join(rootPath, 'src', 'b.ts'), 'export const b = 1;\n', 'utf8');
    await writeFile(
      path.join(rootPath, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { module: 'NodeNext', moduleResolution: 'NodeNext' } }, null, 2),
      'utf8'
    );
    git(rootPath, 'add', '.');
    git(rootPath, 'commit', '-m', 'base');
    const baseRef = git(rootPath, 'rev-parse', 'HEAD');

    await writeFile(
      path.join(rootPath, 'src', 'b.ts'),
      "import { a } from './a.js';\nexport const b = a + 1;\n",
      'utf8'
    );
    git(rootPath, 'add', '.');
    git(rootPath, 'commit', '-m', 'introduce cycle');
    const headRef = git(rootPath, 'rev-parse', 'HEAD');

    const report = await compareGitRefs({ rootPath, baseRef, headRef });

    expect(report.kind).toBe('diff');
    expect(report.drift?.addedFindings.some((finding) => finding.type === 'cycle')).toBe(true);
  });
});
