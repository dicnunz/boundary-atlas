export type BoundaryAtlasGranularity = 'file' | 'folder' | 'package';
export type BoundaryAtlasFindingType =
  | 'cycle'
  | 'deep-import'
  | 'dead-export'
  | 'boundary-violation'
  | 'cross-feature'
  | 'hotspot';
export type BoundaryAtlasSeverity = 'info' | 'warn' | 'high';

export interface BoundaryAtlasGraphNode {
  id: string;
  kind: BoundaryAtlasGranularity;
  label: string;
  path: string;
  packageName?: string;
  featureRoot?: string;
  isPublicEntrypoint?: boolean;
  fanIn: number;
  fanOut: number;
}

export interface BoundaryAtlasGraphEdge {
  id: string;
  source: string;
  target: string;
  kind: 'import' | 'reexport';
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
  sourcePath?: string;
  targetPath?: string;
  specifier?: string;
  details?: string;
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

export interface BoundaryAtlasDrift {
  baseRef: string;
  headRef: string;
  addedFindings: Array<{ fingerprint: string; title: string; type: BoundaryAtlasFindingType; severity: BoundaryAtlasSeverity }>;
  removedFindings: Array<{ fingerprint: string; title: string; type: BoundaryAtlasFindingType; severity: BoundaryAtlasSeverity }>;
  hotspotDeltas: Array<{
    id: string;
    granularity: BoundaryAtlasGranularity;
    path: string;
    fanInBefore: number;
    fanInAfter: number;
    fanOutBefore: number;
    fanOutAfter: number;
  }>;
}

export interface BoundaryAtlasReport {
  kind: 'analysis' | 'diff';
  version: '1';
  generatedAt: string;
  project: {
    label: string;
    rootPath: string;
    repoName: string;
    analyzedAtRef?: string;
    configPath?: string;
  };
  summary: {
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
  };
  graphs: Record<BoundaryAtlasGranularity, BoundaryAtlasGraph>;
  findings: BoundaryAtlasFinding[];
  hotspots: BoundaryAtlasHotspot[];
  deadExports: Array<{
    id: string;
    filePath: string;
    exportName: string;
    line: number;
    sourceNodeId: string;
    reason: string;
  }>;
  publicEntrypoints: string[];
  drift?: BoundaryAtlasDrift;
}
