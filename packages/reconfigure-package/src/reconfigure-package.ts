#!/usr/bin/env node

import path from 'path';
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'fs';

import { findGitRootPath } from '@gen-epix/tools-lib';

if (process.argv.length !== 4) {
  console.error('Usage: reconfigure-package <packageDir> <post|pre>');
  process.exit(1);
}
const packageDir = process.argv[2];
const prePost = process.argv[3];

if (prePost !== 'post' && prePost !== 'pre') {
  console.error('Invalid argument. Use "post" or "pre".');
  process.exit(1);
}


type PackageJson = {
  name: string;
  files: string[];
  main: string;
  exports: {
    [key: string]: {
      [key: string]: string;
    };
  };
  types: string;
};
const gitRootPath = findGitRootPath();
const packagePath = path.join(gitRootPath, packageDir);
const packageJsonPath = path.join(packagePath, 'package.json');

if (!existsSync(packageJsonPath)) {
  console.error(`Package.json not found at ${packageJsonPath}`);
  process.exit(1);
}
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;


if (prePost === 'pre') {
  packageJson.files = ['dist'];
  packageJson.main = './dist/index.js';
  packageJson.exports = {
    '.': {
      types: './dist/index.d.ts',
      import: './dist/index.js',
    },
  };
  packageJson.types = './dist/index.d.ts';
  const packageName = packageJson.name.split('/')?.[1];
  if (packageName) {
    const mainTypesPath = path.join(packagePath, 'src', '@types', `${packageName}.d.ts`);
    if (existsSync(mainTypesPath)) {
      packageJson.exports['./client'] = {
        types: `./dist/${packageName}.d.ts`,
      };
    }
  }
} else {
  packageJson.files = ['src'];
  packageJson.main = './src/index.ts';
  delete packageJson.exports;
  delete packageJson.types;
}


writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
