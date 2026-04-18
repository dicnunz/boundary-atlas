import type { BoundaryAtlasConfig } from './config.js';

export type BoundaryAtlasGranularity = 'file' | 'folder' | 'package';
export type BoundaryAtlasFindingType =
  | 'cycle'
  | 'deep-import'
  | 'dead-export'
  | 'boundary-violation'
  | 'cross-feature'
  | 'hotspot';
export type BoundaryAtlasSeverity = 'info' | 'warn' | 'high';
export type BoundaryAtlasEdgeKind = 'import' | 'reexport';

export interface BoundaryAtlasProjectMetadata {
  label: string;
  rootPath: string;
  repoName: string;
  analyzedAtRef?: string | undefined;
  configPath?: string | undefined;
}

export interface BoundaryAtlasGraphNode {
  id: string;
  kind: BoundaryAtlasGranularity;
  label: string;
  path: string;
  packageName?: string;
  featureRoot?: string | undefined;
  isPublicEntrypoint?: boolean;
  fanIn: number;
  fanOut: number;
}

export interface BoundaryAtlasGraphEdge {
  id: string;
  source: string;
  target: string;
  kind: BoundaryAtlasEdgeKind;
  importCount: number;
  specifiers: string[];
}

export interface BoundaryAtlasGraph {
  granularity: BoundaryAtlasGranularity;
  nodes: BoundaryAtlasGraphNode[];
  edges: BoundaryAtlasGraphEdge[];
}

export interface BoundaryAtlasFindingEvidence {
  label: string;
  sourcePath?: string | undefined;
  targetPath?: string | undefined;
  specifier?: string | undefined;
  details?: string | undefined;
}

export interface BoundaryAtlasFinding {
  id: string;
  fingerprint: string;
  type: BoundaryAtlasFindingType;
  severity: BoundaryAtlasSeverity;
  title: string;
  summary: string;
  whyRisky: string;
  nodeIds: string[];
  evidence: BoundaryAtlasFindingEvidence[];
  metrics?: Record<string, number | string | boolean> | undefined;
  riskId?: string | undefined;
  riskSummary?: string | undefined;
}

export interface BoundaryAtlasRisk {
  id: string;
  type: BoundaryAtlasFindingType;
  severity: BoundaryAtlasSeverity;
  title: string;
  summary: string;
  because: string[];
  evidence: BoundaryAtlasFindingEvidence[];
  findingFingerprints: string[];
}

export interface BoundaryAtlasDeadExport {
  id: string;
  filePath: string;
  exportName: string;
  line: number;
  sourceNodeId: string;
  reason: string;
}

export interface BoundaryAtlasHotspot {
  id: string;
  granularity: BoundaryAtlasGranularity;
  nodeId: string;
  label: string;
  path: string;
  fanIn: number;
  fanOut: number;
  rationale: string;
}

export interface BoundaryAtlasDriftChange {
  fingerprint: string;
  title: string;
  type: BoundaryAtlasFindingType;
  severity: BoundaryAtlasSeverity;
}

export interface BoundaryAtlasHotspotDelta {
  id: string;
  granularity: BoundaryAtlasGranularity;
  path: string;
  fanInBefore: number;
  fanInAfter: number;
  fanOutBefore: number;
  fanOutAfter: number;
}

export type BoundaryAtlasGitFileChangeStatus =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'type-changed'
  | 'unknown';

export interface BoundaryAtlasGitFileChange {
  status: BoundaryAtlasGitFileChangeStatus;
  path: string;
  previousPath?: string | undefined;
}

export interface BoundaryAtlasGraphDrift {
  addedNodes: string[];
  removedNodes: string[];
  addedEdges: BoundaryAtlasGraphEdge[];
  removedEdges: BoundaryAtlasGraphEdge[];
}

export interface BoundaryAtlasDrift {
  baseRef: string;
  headRef: string;
  addedFindings: BoundaryAtlasDriftChange[];
  removedFindings: BoundaryAtlasDriftChange[];
  hotspotDeltas: BoundaryAtlasHotspotDelta[];
  changedFiles?: BoundaryAtlasGitFileChange[] | undefined;
  fileGraph?: BoundaryAtlasGraphDrift | undefined;
}

export interface BoundaryAtlasSummary {
  fileCount: number;
  folderCount: number;
  packageCount: number;
  internalEdgeCount: number;
  cycleCount: number;
  deepImportCount: number;
  deadExportCount: number;
  boundaryViolationCount: number;
  crossFeatureCount: number;
  hotspotCount: number;
  riskCount?: number | undefined;
  findingCounts?: Partial<Record<BoundaryAtlasFindingType, number>> | undefined;
}

export interface BoundaryAtlasReport {
  kind: 'analysis' | 'diff';
  version: '1';
  generatedAt: string;
  project: BoundaryAtlasProjectMetadata;
  summary: BoundaryAtlasSummary;
  config: BoundaryAtlasConfig;
  graphs: Record<BoundaryAtlasGranularity, BoundaryAtlasGraph>;
  findings: BoundaryAtlasFinding[];
  hotspots: BoundaryAtlasHotspot[];
  deadExports: BoundaryAtlasDeadExport[];
  publicEntrypoints: string[];
  risks?: BoundaryAtlasRisk[] | undefined;
  drift?: BoundaryAtlasDrift | undefined;
}

export interface BoundaryAtlasReportInput {
  kind?: BoundaryAtlasReport['kind'];
  version?: BoundaryAtlasReport['version'];
  generatedAt?: string;
  project: BoundaryAtlasProjectMetadata;
  config: BoundaryAtlasConfig;
  graphs: BoundaryAtlasReport['graphs'];
  findings: BoundaryAtlasFinding[];
  hotspots: BoundaryAtlasHotspot[];
  deadExports: BoundaryAtlasDeadExport[];
  publicEntrypoints: string[];
  drift?: BoundaryAtlasDrift | undefined;
  risks?: BoundaryAtlasRisk[] | undefined;
}
