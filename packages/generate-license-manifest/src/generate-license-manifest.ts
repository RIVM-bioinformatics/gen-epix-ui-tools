#!/usr/bin/env node

import path from 'path';
import {
  existsSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from 'fs';

import { findGitRootPath } from '@gen-epix/tools-lib';

if (process.argv.length !== 3) {
  console.error('Usage: generate-license-manifest <packageDir>');
  process.exit(1);
}

const packageDir = path.isAbsolute(process.argv[2])
  ? process.argv[2]
  : path.join(findGitRootPath(), process.argv[2]);
if (!existsSync(packageDir)) {
  console.error(`Directory not found: ${packageDir}`);
  process.exit(1);
}

const targetDir = path.join(packageDir, 'public');
if (!existsSync(targetDir)) {
  console.error(`Directory not found: ${targetDir}`);
  process.exit(1);
}

// Verify this is a pnpm environment by finding a node_modules/.pnpm directory
// walking up from packageDir (monorepos keep the store at the workspace root).
const findPnpmStore = (startDir: string): boolean => {
  let current = startDir;
  while (true) {
    if (existsSync(path.join(current, 'node_modules', '.pnpm'))) {
      return true;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return false;
    }
    current = parent;
  }
};

if (!findPnpmStore(packageDir)) {
  console.error('Error: no pnpm environment detected (node_modules/.pnpm not found). This tool only supports pnpm.');
  process.exit(1);
}

console.log(`Generating license manifest from ${packageDir} to ${targetDir}`);

type PackageJson = {
  dependencies?: Record<string, string>;
  homepage: string;
  license: string;
  name: string;
  optionalDependencies?: Record<string, string>;
  version: string;
};

const licenseEntries: Map<string, PackageJson> = new Map();

const visitedPaths = new Set<string>();

// Resolve a module name from a starting directory using Node.js resolution
// (walk up through parent directories). Works correctly with pnpm's virtual
// store because siblings in .pnpm/<pkg>/node_modules/ are found by walking up.
const findModule = (startDir: string, moduleName: string): null | string => {
  let current = startDir;
  while (true) {
    const candidate = path.join(current, 'node_modules', moduleName);
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
};

const processPackage = (pkgDir: string): void => {
  let realDir: string;
  try {
    realDir = realpathSync(pkgDir);
  } catch {
    return;
  }
  if (visitedPaths.has(realDir)) {
    return;
  }
  visitedPaths.add(realDir);

  const packageJsonPath = path.join(realDir, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;

  if (packageJson.name && !licenseEntries.has(packageJson.name)) {
    licenseEntries.set(packageJson.name, {
      homepage: packageJson.homepage,
      license: packageJson.license,
      name: packageJson.name,
      version: packageJson.version,
    });
  }

  // Recurse into all runtime dependencies (direct + optional).
  // We search from realDir so that pnpm's sibling deps in
  // .pnpm/<pkg>/node_modules/ are discovered by walking up one level.
  const deps = Object.keys({
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.optionalDependencies ?? {}),
  });
  for (const dep of deps) {
    const depDir = findModule(realDir, dep);
    if (depDir) {
      processPackage(depDir);
    }
  }
};

const rootPackageJsonPath = path.join(packageDir, 'package.json');
if (!existsSync(rootPackageJsonPath)) {
  console.error(`No package.json found in ${packageDir}`);
  process.exit(1);
}
const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf-8')) as PackageJson;
const rootDeps = Object.keys({
  ...(rootPackageJson.dependencies ?? {}),
  ...(rootPackageJson.optionalDependencies ?? {}),
});

for (const dep of rootDeps) {
  const depDir = findModule(packageDir, dep);
  if (depDir) {
    processPackage(depDir);
  }
}

const targetFilePath = path.join(targetDir, 'licenses.json');

if (existsSync(targetFilePath)) {
  unlinkSync(targetFilePath);
}
writeFileSync(targetFilePath, JSON.stringify(Array.from(licenseEntries.values()).sort((a, b) => {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}), null, 2), 'utf-8');

console.log(`Generated license manifest at ${targetFilePath}`);
