import path from 'node:path';
import { existsSync } from 'node:fs';
import {
  ExportDeclaration,
  ImportDeclaration,
  ModuleResolutionKind,
  Project,
  ts
} from 'ts-morph';
import type { BoundaryAtlasConfig } from '../types/config.js';
import { DEFAULT_EXCLUDE } from '../types/config.js';
import type { ProjectGraphData } from './workspace.js';
import {
  buildSourceNode,
  discoverPackages,
  discoverPublicEntrypoints,
  discoverSourceFilePaths
} from './workspace.js';
import { createPathMatchers } from './workspace.js';

function createProject(rootPath: string): Project {
  const tsconfigPath = path.join(rootPath, 'tsconfig.json');
  if (existsSync(tsconfigPath)) {
    return new Project({
      tsConfigFilePath: tsconfigPath,
      skipFileDependencyResolution: false
    });
  }

  return new Project({
    compilerOptions: {
      allowJs: true,
      checkJs: false,
      jsx: ts.JsxEmit.ReactJSX,
      moduleResolution: ModuleResolutionKind.NodeNext,
      resolveJsonModule: true,
      target: ts.ScriptTarget.ES2022
    },
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: false
  });
}

function collectImportedNamesFromImportDeclaration(declaration: ImportDeclaration): string[] {
  const importedNames: string[] = [];
  const importClause = declaration.getImportClause();

  if (!importClause) {
    return importedNames;
  }

  if (importClause.getDefaultImport()) {
    importedNames.push('default');
  }

  if (importClause.getNamespaceImport()) {
    importedNames.push('*');
  }

  for (const namedImport of importClause.getNamedImports()) {
    importedNames.push(namedImport.getNameNode().getText());
  }

  return importedNames;
}

function collectImportedNamesFromExportDeclaration(declaration: ExportDeclaration): string[] {
  if (declaration.isNamespaceExport()) {
    return ['*'];
  }

  const namedExports = declaration.getNamedExports();
  if (namedExports.length === 0) {
    return ['*'];
  }

  return namedExports.map((namedExport) => namedExport.getNameNode().getText());
}

export function buildProjectGraph(rootPath: string, config: BoundaryAtlasConfig): ProjectGraphData {
  const sourcePaths = discoverSourceFilePaths(rootPath, config);
  const project = createProject(rootPath);
  const packages = discoverPackages(rootPath);
  const publicEntrypoints = discoverPublicEntrypoints(sourcePaths, packages, config);
  const excluded = createPathMatchers(config.exclude ?? DEFAULT_EXCLUDE);
  const absoluteSourcePaths = sourcePaths.map((sourcePath) => path.join(rootPath, sourcePath));

  project.addSourceFilesAtPaths(absoluteSourcePaths);
  project.resolveSourceFileDependencies();

  const nodes = new Map<string, ReturnType<typeof buildSourceNode>>();
  const folderPaths = new Set<string>();

  for (const sourceFile of project.getSourceFiles()) {
    const absolutePath = sourceFile.getFilePath();
    const relativePath = path.relative(rootPath, absolutePath).replaceAll(path.sep, '/');
    if (excluded.some((matcher) => matcher(relativePath))) {
      continue;
    }

    if (!sourcePaths.includes(relativePath)) {
      continue;
    }

    const node = buildSourceNode(rootPath, absolutePath, packages, publicEntrypoints, sourceFile);
    nodes.set(node.path, node);
    folderPaths.add(node.folderPath);
  }

  const edges: ProjectGraphData['edges'] = [];

  for (const sourceFile of project.getSourceFiles()) {
    const sourceRelativePath = path.relative(rootPath, sourceFile.getFilePath()).replaceAll(path.sep, '/');
    const sourceNode = nodes.get(sourceRelativePath);
    if (!sourceNode) {
      continue;
    }

    for (const importDeclaration of sourceFile.getImportDeclarations()) {
      const targetFile = importDeclaration.getModuleSpecifierSourceFile();
      if (!targetFile) {
        continue;
      }

      const targetRelativePath = path.relative(rootPath, targetFile.getFilePath()).replaceAll(path.sep, '/');
      const targetNode = nodes.get(targetRelativePath);
      if (!targetNode) {
        continue;
      }

      edges.push({
        id: `edge:${sourceNode.path}->${targetNode.path}:import:${edges.length}`,
        sourcePath: sourceNode.path,
        targetPath: targetNode.path,
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        kind: 'import',
        specifier: importDeclaration.getModuleSpecifierValue(),
        importedNames: collectImportedNamesFromImportDeclaration(importDeclaration)
      });
    }

    for (const exportDeclaration of sourceFile.getExportDeclarations()) {
      const targetFile = exportDeclaration.getModuleSpecifierSourceFile();
      if (!targetFile) {
        continue;
      }

      const targetRelativePath = path.relative(rootPath, targetFile.getFilePath()).replaceAll(path.sep, '/');
      const targetNode = nodes.get(targetRelativePath);
      if (!targetNode) {
        continue;
      }

      edges.push({
        id: `edge:${sourceNode.path}->${targetNode.path}:reexport:${edges.length}`,
        sourcePath: sourceNode.path,
        targetPath: targetNode.path,
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        kind: 'reexport',
        specifier: exportDeclaration.getModuleSpecifierValue() ?? '',
        importedNames: collectImportedNamesFromExportDeclaration(exportDeclaration)
      });
    }
  }

  return {
    rootPath,
    config,
    nodes,
    edges,
    packages: new Map(packages.map((currentPackage) => [currentPackage.id, currentPackage])),
    publicEntrypoints,
    folderPaths
  };
}
