import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { analyzeRepository } from '../analyze/analyze-repository.js';
import type { CompareGitRefsOptions } from '../types/config.js';
import type {
  BoundaryAtlasDrift,
  BoundaryAtlasDriftChange,
  BoundaryAtlasHotspotDelta,
  BoundaryAtlasReport
} from '../types/report.js';

function toDriftChange(finding: BoundaryAtlasReport['findings'][number]): BoundaryAtlasDriftChange {
  return {
    fingerprint: finding.fingerprint,
    title: finding.title,
    type: finding.type,
    severity: finding.severity
  };
}

async function extractGitRef(rootPath: string, ref: string): Promise<string> {
  const targetDir = await mkdtemp(path.join(tmpdir(), 'boundary-atlas-'));

  await new Promise<void>((resolve, reject) => {
    const archive = spawn('git', ['archive', '--format=tar', ref], {
      cwd: rootPath,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const extract = spawn('tar', ['-x', '-C', targetDir], {
      stdio: ['pipe', 'ignore', 'pipe']
    });

    let stderr = '';
    let archiveDone = false;
    let extractDone = false;

    const maybeFinish = () => {
      if (archiveDone && extractDone) {
        resolve();
      }
    };

    archive.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    extract.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    archive.on('error', reject);
    extract.on('error', reject);

    archive.stdout.pipe(extract.stdin);

    archive.on('close', (code) => {
      archiveDone = true;
      if (code !== 0) {
        reject(new Error(stderr || `git archive failed for ref ${ref}`));
        return;
      }
      maybeFinish();
    });

    extract.on('close', (code) => {
      extractDone = true;
      if (code !== 0) {
        reject(new Error(stderr || `tar extract failed for ref ${ref}`));
        return;
      }
      maybeFinish();
    });
  });

  return targetDir;
}

function diffHotspots(
  baseReport: BoundaryAtlasReport,
  headReport: BoundaryAtlasReport
): BoundaryAtlasHotspotDelta[] {
  const baseMap = new Map(
    baseReport.hotspots.map((hotspot) => [`${hotspot.granularity}:${hotspot.path}`, hotspot])
  );
  const headMap = new Map(
    headReport.hotspots.map((hotspot) => [`${hotspot.granularity}:${hotspot.path}`, hotspot])
  );

  const keys = new Set([...baseMap.keys(), ...headMap.keys()]);
  const deltas: BoundaryAtlasHotspotDelta[] = [];

  for (const key of keys) {
    const before = baseMap.get(key);
    const after = headMap.get(key);
    if (!before || !after) {
      continue;
    }

    if (before.fanIn === after.fanIn && before.fanOut === after.fanOut) {
      continue;
    }

    deltas.push({
      id: `hotspot-delta:${key}`,
      granularity: after.granularity,
      path: after.path,
      fanInBefore: before.fanIn,
      fanInAfter: after.fanIn,
      fanOutBefore: before.fanOut,
      fanOutAfter: after.fanOut
    });
  }

  return deltas.sort((left, right) => left.path.localeCompare(right.path));
}

function buildDrift(
  baseRef: string,
  headRef: string,
  baseReport: BoundaryAtlasReport,
  headReport: BoundaryAtlasReport
): BoundaryAtlasDrift {
  const baseFindings = new Map(baseReport.findings.map((finding) => [finding.fingerprint, finding]));
  const headFindings = new Map(headReport.findings.map((finding) => [finding.fingerprint, finding]));

  const addedFindings = [...headFindings.values()]
    .filter((finding) => !baseFindings.has(finding.fingerprint))
    .map(toDriftChange)
    .sort((left, right) => left.title.localeCompare(right.title));

  const removedFindings = [...baseFindings.values()]
    .filter((finding) => !headFindings.has(finding.fingerprint))
    .map(toDriftChange)
    .sort((left, right) => left.title.localeCompare(right.title));

  return {
    baseRef,
    headRef,
    addedFindings,
    removedFindings,
    hotspotDeltas: diffHotspots(baseReport, headReport)
  };
}

export async function compareGitRefs(
  options: CompareGitRefsOptions
): Promise<BoundaryAtlasReport> {
  const { rootPath, baseRef, headRef, configPath } = options;
  const [baseDir, headDir] = await Promise.all([
    extractGitRef(rootPath, baseRef),
    extractGitRef(rootPath, headRef)
  ]);

  try {
    const [baseReport, headReport] = await Promise.all([
      analyzeRepository({
        rootPath: baseDir,
        ...(configPath ? { configPath } : {}),
        label: `${path.basename(rootPath)}@${baseRef}`
      }),
      analyzeRepository({
        rootPath: headDir,
        ...(configPath ? { configPath } : {}),
        label: `${path.basename(rootPath)}@${headRef}`
      })
    ]);

    return {
      ...headReport,
      kind: 'diff',
      project: {
        ...headReport.project,
        rootPath,
        analyzedAtRef: headRef
      },
      drift: buildDrift(baseRef, headRef, baseReport, headReport)
    };
  } finally {
    await Promise.all([
      rm(baseDir, { recursive: true, force: true }),
      rm(headDir, { recursive: true, force: true })
    ]);
  }
}
