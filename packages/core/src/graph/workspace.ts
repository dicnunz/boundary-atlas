import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import picomatch from 'picomatch';
import type { SourceFile } from 'ts-morph';
import {
  DEFAULT_EXCLUDE,
  DEFAULT_INCLUDE,
  DEFAULT_PUBLIC_ENTRYPOINTS,
  type BoundaryAtlasConfig
} from '../types/config.js';
import {
  directoryLabel,
  findFeatureRoot,
  isSourceFilePath,
  normalizeForMatch,
  relativePosix
} from './path-utils.js';

export interface WorkspacePackage {
  id: string;
  name: string;
  rootPath: string;
  rootRelativePath: string;
  entrypoints: string[];
}

export interface LocalExportRecord {
  id: string;
  name: string;
  line: number;
}

export interface SourceNodeRecord {
  id: string;
  path: string;
  label: string;
  folderPath: string;
  packageId: string;
  packageName: string;
  featureRoot?: string | undefined;
  isPublicEntrypoint: boolean;
  exports: LocalExportRecord[];
}

export interface ImportEdgeRecord {
  id: string;
  sourcePath: string;
  targetPath: string;
  sourceNodeId: string;
  targetNodeId: string;
  kind: 'import' | 'reexport';
  specifier: string;
  importedNames: string[];
}

export interface ProjectGraphData {
  rootPath: string;
  config: BoundaryAtlasConfig;
  nodes: Map<string, SourceNodeRecord>;
  edges: ImportEdgeRecord[];
  packages: Map<string, WorkspacePackage>;
  publicEntrypoints: Set<string>;
  folderPaths: Set<string>;
}

function walkDirectories(rootPath: string, relativePath = '', output: string[] = []): string[] {
  const absolutePath = relativePath === '' ? rootPath : path.join(rootPath, relativePath);
  const entries = readdirSync(absolutePath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }

    const childRelative = relativePath === '' ? entry.name : path.posix.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      output.push(childRelative);
      walkDirectories(rootPath, childRelative, output);
    }
  }

  return output;
}

function resolveFileCandidate(filePath: string): string | undefined {
  const candidates = [
    filePath,
    `${filePath}.ts`,
    `${filePath}.tsx`,
    `${filePath}.js`,
    `${filePath}.jsx`,
    `${filePath}.mts`,
    `${filePath}.mjs`,
    `${filePath}.cts`,
    `${filePath}.cjs`,
    path.join(filePath, 'index.ts'),
    path.join(filePath, 'index.tsx'),
    path.join(filePath, 'index.js'),
    path.join(filePath, 'index.jsx')
  ];

  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

function collectExportEntryCandidates(value: unknown, output: string[]): void {
  if (typeof value === 'string') {
    output.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectExportEntryCandidates(item, output);
    }
    return;
  }

  if (value && typeof value === 'object') {
    for (const nestedValue of Object.values(value)) {
      collectExportEntryCandidates(nestedValue, output);
    }
  }
}

function readPackageEntrypoints(packageRoot: string, repoRoot: string): string[] {
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>;
  const candidates: string[] = [];

  for (const key of ['main', 'module', 'types', 'typings', 'browser']) {
    const value = packageJson[key];
    if (typeof value === 'string') {
      candidates.push(value);
    }
  }

  collectExportEntryCandidates(packageJson.exports, candidates);

  const resolved = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate.startsWith('.')) {
      continue;
    }

    const absoluteCandidate = resolveFileCandidate(path.resolve(packageRoot, candidate));
    if (absoluteCandidate) {
      resolved.add(relativePosix(repoRoot, absoluteCandidate));
    }
  }

  for (const fallback of ['index.ts', 'index.tsx', 'index.js', 'index.jsx', 'src/index.ts', 'src/index.tsx']) {
    const absoluteFallback = path.join(packageRoot, fallback);
    if (existsSync(absoluteFallback) && statSync(absoluteFallback).isFile()) {
      resolved.add(relativePosix(repoRoot, absoluteFallback));
    }
  }

  return [...resolved];
}

export function discoverPackages(rootPath: string): WorkspacePackage[] {
  const packageRoots = [rootPath];

  for (const directory of walkDirectories(rootPath)) {
    const candidate = path.join(rootPath, directory, 'package.json');
    if (existsSync(candidate)) {
      packageRoots.push(path.join(rootPath, directory));
    }
  }

  const packages = packageRoots
    .filter((packageRoot, index, values) => values.indexOf(packageRoot) === index)
    .map((packageRoot) => {
      const packageJsonPath = path.join(packageRoot, 'package.json');
      const parsed = existsSync(packageJsonPath)
        ? (JSON.parse(readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>)
        : {};
      const rootRelativePath = relativePosix(rootPath, packageRoot);
      const id = rootRelativePath === '.' ? 'package:root' : `package:${rootRelativePath}`;
      const name =
        typeof parsed.name === 'string'
          ? parsed.name
          : rootRelativePath === '.'
            ? path.basename(rootPath)
            : rootRelativePath;

      return {
        id,
        name,
        rootPath: packageRoot,
        rootRelativePath,
        entrypoints: existsSync(packageJsonPath) ? readPackageEntrypoints(packageRoot, rootPath) : []
      } satisfies WorkspacePackage;
    })
    .sort((left, right) => right.rootRelativePath.length - left.rootRelativePath.length);

  return packages;
}

function matchesAny(matchers: Array<(value: string) => boolean>, relativePath: string): boolean {
  return matchers.some((matcher) => matcher(relativePath));
}

export function createPathMatchers(patterns: string[]): Array<(value: string) => boolean> {
  return patterns.map((pattern) => {
    const matcher = picomatch(pattern);
    return (value: string) => matcher(normalizeForMatch(value));
  });
}

export function findOwningPackage(
  packages: WorkspacePackage[],
  rootPath: string,
  filePath: string
): WorkspacePackage {
  const relativePath = relativePosix(rootPath, filePath);
  const match = packages.find((currentPackage) => {
    if (currentPackage.rootRelativePath === '.') {
      return true;
    }

    return (
      relativePath === currentPackage.rootRelativePath ||
      relativePath.startsWith(`${currentPackage.rootRelativePath}/`)
    );
  });

  return match ?? packages[packages.length - 1]!;
}

export function discoverSourceFilePaths(rootPath: string, config: BoundaryAtlasConfig): string[] {
  const includeMatchers = createPathMatchers(config.include ?? DEFAULT_INCLUDE);
  const excludeMatchers = createPathMatchers(config.exclude ?? DEFAULT_EXCLUDE);
  const discovered = walkDirectories(rootPath, '', ['']);
  const files: string[] = [];

  for (const directory of discovered) {
    const absoluteDirectory = directory === '' ? rootPath : path.join(rootPath, directory);
    const entries = readdirSync(absoluteDirectory, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const relativePath =
        directory === '' ? entry.name : path.posix.join(normalizeForMatch(directory), entry.name);

      if (!isSourceFilePath(relativePath)) {
        continue;
      }

      if (matchesAny(excludeMatchers, relativePath)) {
        continue;
      }

      if (!matchesAny(includeMatchers, relativePath)) {
        continue;
      }

      files.push(relativePath);
    }
  }

  return files.sort();
}

export function discoverPublicEntrypoints(
  sourcePaths: string[],
  packages: WorkspacePackage[],
  config: BoundaryAtlasConfig
): Set<string> {
  const matchers = createPathMatchers(config.publicEntrypoints ?? DEFAULT_PUBLIC_ENTRYPOINTS);
  const entrypoints = new Set<string>();

  for (const sourcePath of sourcePaths) {
    if (matchesAny(matchers, sourcePath)) {
      entrypoints.add(sourcePath);
    }
  }

  for (const currentPackage of packages) {
    for (const entrypoint of currentPackage.entrypoints) {
      entrypoints.add(normalizeForMatch(entrypoint));
    }
  }

  return entrypoints;
}

export function collectLocalExports(sourceFile: SourceFile): LocalExportRecord[] {
  const localExports = new Map<string, LocalExportRecord>();

  for (const [name, declarations] of sourceFile.getExportedDeclarations()) {
    const localDeclaration = declarations.find(
      (declaration) => declaration.getSourceFile().getFilePath() === sourceFile.getFilePath()
    );

    if (localDeclaration) {
      localExports.set(name, {
        id: `export:${sourceFile.getBaseNameWithoutExtension()}:${name}:${localDeclaration.getStartLineNumber()}`,
        name,
        line: localDeclaration.getStartLineNumber()
      });
    }
  }

  const defaultSymbol = sourceFile.getDefaultExportSymbol();
  const defaultDeclaration = defaultSymbol?.getDeclarations()[0];
  if (defaultDeclaration && !localExports.has('default')) {
    localExports.set('default', {
      id: `export:${sourceFile.getBaseNameWithoutExtension()}:default:${defaultDeclaration.getStartLineNumber()}`,
      name: 'default',
      line: defaultDeclaration.getStartLineNumber()
    });
  }

  return [...localExports.values()].sort((left, right) => left.line - right.line);
}

export function buildSourceNode(
  rootPath: string,
  filePath: string,
  packages: WorkspacePackage[],
  publicEntrypoints: Set<string>,
  sourceFile: SourceFile
): SourceNodeRecord {
  const relativePath = relativePosix(rootPath, filePath);
  const owningPackage = findOwningPackage(packages, rootPath, filePath);
  const featureRoot = findFeatureRoot(relativePath);

  return {
    id: `file:${relativePath}`,
    path: relativePath,
    label: path.posix.basename(relativePath),
    folderPath: directoryLabel(relativePath),
    packageId: owningPackage.id,
    packageName: owningPackage.name,
    ...(featureRoot ? { featureRoot } : {}),
    isPublicEntrypoint: publicEntrypoints.has(relativePath),
    exports: collectLocalExports(sourceFile)
  };
}
