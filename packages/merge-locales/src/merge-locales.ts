#!/usr/bin/env node

import { resolve } from 'path';

import { mergeLocales } from './lib.js';

interface CliArguments {
  outputDirectory: string;
  sourceDirectories: string[];
}
const parseArguments = (): CliArguments => {
  const [outputDirectory, ...sourceDirectories] = process.argv.slice(2);

  if (!outputDirectory || sourceDirectories.length === 0) {
    console.error('Usage: merge-locales <output-directory> <source-directory> [...source-directories]');
    process.exit(1);
  }

  return {
    outputDirectory: resolve(outputDirectory),
    sourceDirectories: sourceDirectories.map(sourceDirectory => resolve(sourceDirectory)),
  };
};

const { outputDirectory, sourceDirectories } = parseArguments();
try {
  for (const outputPath of mergeLocales({
    outputDirectory: resolve(outputDirectory),
    sourceDirectories: sourceDirectories.map(sourceDirectory => resolve(sourceDirectory)),
  })) {
    console.log(`Merged locale into ${outputPath}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : JSON.stringify(error));
  process.exit(1);
}
