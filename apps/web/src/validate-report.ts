import type { BoundaryAtlasReport } from './report-types.js';

export const MAX_REPORT_BYTES = 20 * 1024 * 1024;
const MAX_ISSUES = 8;
const GRANULARITIES = ['file', 'folder', 'package'] as const;
const FINDING_TYPES = ['cycle', 'deep-import', 'dead-export', 'boundary-violation', 'cross-feature', 'hotspot'];

type Check = (value: unknown, path: string, issues: string[]) => void;
export type ReportValidation =
  | { ok: true; report: BoundaryAtlasReport }
  | { ok: false; message: string; issues: string[] };

function issue(issues: string[], path: string, message: string) {
  if (issues.length < MAX_ISSUES) issues.push(`${path}: ${message}`);
}

const string: Check = (value, path, issues) => {
  if (typeof value !== 'string') issue(issues, path, 'expected text');
};
const identifier: Check = (value, path, issues) => {
  if (typeof value !== 'string' || !value.trim()) issue(issues, path, 'expected a non-empty identifier');
};
const count: Check = (value, path, issues) => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    issue(issues, path, 'expected a non-negative whole number');
  }
};
const boolean: Check = (value, path, issues) => {
  if (typeof value !== 'boolean') issue(issues, path, 'expected true or false');
};
const optional = (check: Check): Check => (value, path, issues) => {
  if (value !== undefined) check(value, path, issues);
};
const oneOf = (options: readonly string[]): Check => (value, path, issues) => {
  if (typeof value !== 'string' || !options.includes(value)) {
    issue(issues, path, `expected ${options.map((entry) => `"${entry}"`).join(' or ')}`);
  }
};
const array = (check: Check): Check => (value, path, issues) => {
  if (!Array.isArray(value)) return issue(issues, path, 'expected an array');
  for (let index = 0; index < value.length && issues.length < MAX_ISSUES; index += 1) {
    check(value[index], `${path}[${index}]`, issues);
  }
};
const object = (fields: Record<string, Check>): Check => (value, path, issues) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return issue(issues, path, 'expected an object');
  }
  const record = value as Record<string, unknown>;
  for (const [key, check] of Object.entries(fields)) check(record[key], `${path}.${key}`, issues);
};

const findingChange = {
  fingerprint: identifier,
  title: string,
  type: oneOf(FINDING_TYPES),
  severity: oneOf(['info', 'warn', 'high'])
};
const graph = (granularity: string) => object({
  granularity: oneOf([granularity]),
  nodes: array(object({
    id: identifier, kind: oneOf([granularity]), label: string, path: string,
    packageName: optional(string), featureRoot: optional(string),
    isPublicEntrypoint: optional(boolean), fanIn: count, fanOut: count
  })),
  edges: array(object({
    id: identifier, source: identifier, target: identifier, kind: oneOf(['import', 'reexport']),
    importCount: count, specifiers: array(string)
  }))
});
const reportCheck = object({
  kind: oneOf(['analysis', 'diff']),
  version: oneOf(['1']),
  generatedAt: (value, path, issues) => {
    if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
      issue(issues, path, 'expected a valid date string');
    }
  },
  project: object({
    label: string, rootPath: string, repoName: string,
    analyzedAtRef: optional(string), configPath: optional(string)
  }),
  summary: object(Object.fromEntries([
    'fileCount', 'folderCount', 'packageCount', 'internalEdgeCount', 'cycleCount',
    'deepImportCount', 'deadExportCount', 'boundaryViolationCount', 'crossFeatureCount', 'hotspotCount'
  ].map((key) => [key, count]))),
  graphs: object(Object.fromEntries(GRANULARITIES.map((level) => [level, graph(level)]))),
  findings: array(object({
    ...findingChange, id: identifier, summary: string, whyRisky: string, nodeIds: array(identifier),
    evidence: array(object({
      label: string, sourcePath: optional(string), targetPath: optional(string),
      specifier: optional(string), details: optional(string)
    }))
  })),
  hotspots: array(object({
    id: identifier, granularity: oneOf(GRANULARITIES), nodeId: identifier,
    label: string, path: string, fanIn: count, fanOut: count, rationale: string
  })),
  deadExports: array(object({
    id: identifier, filePath: string, exportName: string, line: count, sourceNodeId: identifier, reason: string
  })),
  publicEntrypoints: array(string),
  drift: optional(object({
    baseRef: string, headRef: string,
    addedFindings: array(object(findingChange)), removedFindings: array(object(findingChange)),
    hotspotDeltas: array(object({
      id: identifier, granularity: oneOf(GRANULARITIES), path: string,
      fanInBefore: count, fanInAfter: count, fanOutBefore: count, fanOutAfter: count
    }))
  }))
});

/** Validate the viewer's v1 contract; preserve additional analyzer fields for forward-compatible exports. */
export function validateReport(value: unknown): ReportValidation {
  const issues: string[] = [];
  reportCheck(value, 'report', issues);
  if (issues.length > 0) return { ok: false, message: 'This file is not a supported Boundary Atlas v1 report.', issues };

  const report = value as BoundaryAtlasReport;
  const allNodes = new Set<string>();
  const nodesByGraph = new Map<string, Set<string>>();
  for (const level of GRANULARITIES) {
    const current = report.graphs[level];
    const ids = new Set<string>();
    nodesByGraph.set(level, ids);
    current.nodes.forEach((node, index) => {
      if (allNodes.has(node.id)) issue(issues, `report.graphs.${level}.nodes[${index}].id`, `duplicate node "${node.id}"`);
      ids.add(node.id);
      allNodes.add(node.id);
    });
    const edges = new Set<string>();
    current.edges.forEach((edge, index) => {
      const path = `report.graphs.${level}.edges[${index}]`;
      if (edges.has(edge.id)) issue(issues, `${path}.id`, `duplicate edge "${edge.id}"`);
      edges.add(edge.id);
      for (const endpoint of ['source', 'target'] as const) {
        if (!ids.has(edge[endpoint])) issue(issues, `${path}.${endpoint}`, `node "${edge[endpoint]}" is missing from the ${level} graph`);
      }
    });
  }
  const findingIds = new Set<string>();
  report.findings.forEach((finding, index) => {
    if (findingIds.has(finding.id)) issue(issues, `report.findings[${index}].id`, `duplicate finding "${finding.id}"`);
    findingIds.add(finding.id);
    finding.nodeIds.forEach((id, nodeIndex) => {
      if (!allNodes.has(id)) issue(issues, `report.findings[${index}].nodeIds[${nodeIndex}]`, `node "${id}" is missing`);
    });
  });
  report.hotspots.forEach((hotspot, index) => {
    if (!nodesByGraph.get(hotspot.granularity)?.has(hotspot.nodeId)) {
      issue(issues, `report.hotspots[${index}].nodeId`, 'node is missing from its graph');
    }
  });
  report.deadExports.forEach((entry, index) => {
    if (!nodesByGraph.get('file')?.has(entry.sourceNodeId)) {
      issue(issues, `report.deadExports[${index}].sourceNodeId`, 'node is missing from the file graph');
    }
  });
  if (report.kind === 'diff' && !report.drift) issue(issues, 'report.drift', 'diff reports require comparison details');
  return issues.length > 0
    ? { ok: false, message: 'This report has broken graph references.', issues }
    : { ok: true, report };
}

export function parseReport(text: string): ReportValidation {
  try {
    return validateReport(JSON.parse(text));
  } catch {
    return {
      ok: false,
      message: 'This file is not valid JSON.',
      issues: ['Choose a report.json generated by Boundary Atlas. The file may be incomplete or contain a trailing comma.']
    };
  }
}
