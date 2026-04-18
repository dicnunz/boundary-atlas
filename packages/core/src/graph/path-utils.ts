import path from 'node:path';

const SOURCE_FILE_EXTENSION_VALUES = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mts',
  '.cts',
  '.mjs',
  '.cjs'
] as const;

export const SOURCE_FILE_EXTENSIONS = new Set<string>(SOURCE_FILE_EXTENSION_VALUES);
export const SUPPORTED_SOURCE_EXTENSIONS = [...SOURCE_FILE_EXTENSION_VALUES];

export function toPosixPath(value: string): string {
  return value.replaceAll(path.sep, '/');
}

export function normalizeForMatch(value: string): string {
  const normalized = value.startsWith('./') ? value.slice(2) : value;
  return normalized === '' ? '.' : toPosixPath(normalized);
}

export function relativePosix(from: string, to: string): string {
  const relativePath = path.relative(from, to);
  return relativePath === '' ? '.' : toPosixPath(relativePath);
}

export function relativePathFromRoot(rootDir: string, absolutePath: string): string {
  return relativePosix(rootDir, absolutePath);
}

export function relativeDirectoryFromRoot(rootDir: string, absolutePath: string): string {
  return relativePosix(rootDir, absolutePath);
}

export function directoryLabel(relativePath: string): string {
  const dirname = path.posix.dirname(normalizeForMatch(relativePath));
  return dirname === '.' ? '.' : dirname;
}

export function dirnamePath(filePath: string): string {
  return directoryLabel(filePath);
}

export function basenamePath(filePath: string): string {
  return path.posix.basename(toPosixPath(filePath));
}

export function repoLabelFromRoot(rootPath: string): string {
  return path.basename(rootPath);
}

export function createGraphNodeId(kind: string, pathLike: string): string {
  return `${kind}:${normalizeForMatch(pathLike)}`;
}

export function isSourceFilePath(filePath: string): boolean {
  return SOURCE_FILE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export function hasSupportedSourceExtension(filePath: string): boolean {
  return isSourceFilePath(filePath);
}

export function isWithinRoot(rootDir: string, absolutePath: string): boolean {
  const relativePath = path.relative(rootDir, absolutePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

export function uniqueSorted<T extends string>(values: Iterable<T>): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right)) as T[];
}

export function findFeatureRoot(relativePath: string): string | undefined {
  const segments = normalizeForMatch(relativePath).split('/');
  const markers = new Set(['features', 'feature', 'domains', 'domain', 'modules', 'module']);

  for (let index = 0; index < segments.length - 1; index += 1) {
    if (markers.has(segments[index] ?? '')) {
      const nextSegment = segments[index + 1];

      if (nextSegment) {
        return segments.slice(0, index + 2).join('/');
      }
    }
  }

  return undefined;
}
