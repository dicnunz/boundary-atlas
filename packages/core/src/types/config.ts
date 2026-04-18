import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export interface BoundaryRule {
  name: string;
  from: string[];
  allow: string[];
  description?: string | undefined;
}

export interface BoundaryAtlasConfig {
  include?: string[];
  exclude?: string[];
  publicEntrypoints?: string[];
  boundaries?: BoundaryRule[];
}

export interface LoadedBoundaryAtlasConfig {
  path?: string | undefined;
  config: BoundaryAtlasConfig;
}

export interface AnalyzeRepositoryOptions {
  rootPath: string;
  configPath?: string | undefined;
  label?: string | undefined;
}

export interface CompareGitRefsOptions {
  rootPath: string;
  baseRef: string;
  headRef: string;
  configPath?: string | undefined;
}

export const DEFAULT_INCLUDE = ['**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}'];

export const DEFAULT_EXCLUDE = [
  '**/*.d.ts',
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/.vite/**',
  '**/docs/generated/**'
];

export const DEFAULT_PUBLIC_ENTRYPOINTS = [
  '**/index.ts',
  '**/index.tsx',
  '**/index.js',
  '**/index.jsx',
  '**/index.mts',
  '**/index.mjs',
  '**/index.cts',
  '**/index.cjs'
];

export function resolveConfigPath(rootPath: string, explicitPath?: string): string | undefined {
  if (explicitPath) {
    return path.resolve(rootPath, explicitPath);
  }

  const defaultPath = path.join(rootPath, 'boundary-atlas.config.json');
  return existsSync(defaultPath) ? defaultPath : undefined;
}

export function loadBoundaryAtlasConfig(
  rootPath: string,
  explicitPath?: string
): LoadedBoundaryAtlasConfig {
  const resolvedPath = resolveConfigPath(rootPath, explicitPath);

  if (!resolvedPath) {
    return { config: {} };
  }

  const raw = readFileSync(resolvedPath, 'utf8');
  const parsed = JSON.parse(raw) as BoundaryAtlasConfig;
  return {
    path: resolvedPath,
    config: parsed
  };
}
