import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { analyzeRepository, compareGitRefs } from '../packages/core/src/index.ts';
import { REPO_ROOT, writeReportArtifacts } from './report-export.ts';

const selfReport = await analyzeRepository({
  rootPath: REPO_ROOT,
  configPath: 'boundary-atlas.config.json',
  label: 'boundary-atlas'
});

await writeReportArtifacts(selfReport, path.join(REPO_ROOT, 'docs', 'samples', 'self'));
console.log('exported self analysis');

try {
  execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
    cwd: REPO_ROOT,
    stdio: 'ignore'
  });

  const commitCount = Number(
    execFileSync('git', ['rev-list', '--count', 'HEAD'], {
      cwd: REPO_ROOT,
      encoding: 'utf8'
    }).trim()
  );

  if (commitCount >= 2) {
    const report = await compareGitRefs({
      rootPath: REPO_ROOT,
      baseRef: 'HEAD~1',
      headRef: 'HEAD',
      configPath: 'boundary-atlas.config.json'
    });
    await writeReportArtifacts(report, path.join(REPO_ROOT, 'docs', 'samples', 'self-diff'));
    console.log('exported self diff');
  } else {
    console.log('skipped self diff: repo does not have two commits yet');
  }
} catch {
  console.log('skipped self diff: git history unavailable');
}
