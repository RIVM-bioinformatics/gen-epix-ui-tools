#!/usr/bin/env node

import path from 'path';
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  unlinkSync,
} from 'fs';

import { findGitRootPath } from '@gen-epix/tools-lib';

if (process.argv.length !== 3) {
  console.error('Usage: generate-license-manifest <targetDir>');
  process.exit(1);
}

const targetDir = path.join(findGitRootPath(), process.argv[2]);
if (!existsSync(targetDir)) {
  console.error(`Directory not found: ${targetDir}`);
  process.exit(1);
}

type PackageJson = {
  name: string;
  version: string;
  license: string;
  homepage: string;
};

const licenseEntries: Map<string, PackageJson> = new Map();

const processFolder = (sourceDir: string, trail?: string[]): number => {
  let result = 0;
  const dir = trail ? path.join(sourceDir, ...trail) : sourceDir;

  const subDirs = readdirSync(dir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map((dirent) => dirent.name);

  if (dir.includes('node_modules')) {
    const packageJsonPath = path.join(dir, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
      if (packageJson.name && !licenseEntries.has(packageJson.name)) {
        const entry: PackageJson = {
          name: packageJson.name,
          version: packageJson.version,
          license: packageJson.license,
          homepage: packageJson.homepage,
        };
        licenseEntries.set(packageJson.name, entry);
      }
    }
  }

  subDirs.forEach((subDir) => {
    result += processFolder(sourceDir, [...(trail || []), subDir]);
  });
  return result;
};

processFolder(findGitRootPath());

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
