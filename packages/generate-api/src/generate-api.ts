#!/usr/bin/env node
import * as path from 'path';
import {
  existsSync,
  mkdtempSync,
  rmSync,
  unlinkSync,
  writeFileSync,
  cpSync,
  mkdirSync,
} from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';

import { findGitRootPath } from '@gen-epix/tools-lib';

import {
  fetchOpenApiJson,
  sanitizeApiTs,
  sanitizeBaseTs,
  sanitizeCommonTs,
  sanitizeConfigurationTs,
  sanitizeIndexTs,
  sanitizeOpenApiJson,
} from './lib';

if (process.argv.length !== 3) {
  console.error('Usage: generate-api <targetDir>');
  process.exit(1);
}

const targetDir = path.join(process.cwd(), process.argv[2]);
const tempDir = mkdtempSync(path.join(tmpdir(), 'gen-epix-generate-api-'));

// STEP 1: fetch json, sanitize it and write it to a file
// eslint-disable-next-line @typescript-eslint/no-floating-promises
fetchOpenApiJson('https://127.0.0.1:8000/openapi.json').catch((error) => {
  console.error('Error fetching OpenAPI JSON:', error);
  process.exit(1);
}).then(jsonContent => {
  const sanitizedOpenApiJson = sanitizeOpenApiJson(jsonContent);
  const sanitizedOpenApiJsonPath = path.join(tempDir, 'api.sanitized.json');

  console.log('Writing to', sanitizedOpenApiJsonPath);
  writeFileSync(sanitizedOpenApiJsonPath, JSON.stringify(sanitizedOpenApiJson), 'utf-8');


  // STEP 2: run the openapi-generator-cli to generate the API client
  const generatedApiTargetDir = path.join(tempDir, 'generated');
  const openApiGeneratorCliBinPath = path.join(findGitRootPath(), 'node_modules', '.bin', 'openapi-generator-cli');
  const openApiGeneratorCommand = `${openApiGeneratorCliBinPath} generate -i ${sanitizedOpenApiJsonPath} -g typescript-axios --additional-properties="enumPropertyNaming=original" -o ${generatedApiTargetDir}`;

  console.log('Running command:', openApiGeneratorCommand);
  execSync(openApiGeneratorCommand, { stdio: 'inherit' });

  // STEP 3: post process the generated api
  console.log('Patching generated API files...');
  sanitizeIndexTs(path.join(generatedApiTargetDir, 'index.ts'));
  sanitizeCommonTs(path.join(generatedApiTargetDir, 'common.ts'));
  sanitizeConfigurationTs(path.join(generatedApiTargetDir, 'configuration.ts'));
  sanitizeBaseTs(path.join(generatedApiTargetDir, 'base.ts'));
  sanitizeApiTs(path.join(generatedApiTargetDir, 'api.ts'), ['Subject', 'Filter'], 'Epi');

  // STEP 4: copy the generated files to the target directory
  console.log('Ensuring target directory exists:', targetDir);
  // Ensure the target directory exists

  if (!existsSync(targetDir)) {
    console.log(`Creating target directory: ${targetDir}`);
    mkdirSync(targetDir);
  }
  // Copy files to destination
  ['index.ts', 'api.ts', 'base.ts', 'common.ts', 'configuration.ts'].forEach((filename) => {
    if (existsSync(path.join(targetDir, filename))) {
      console.log(`Removing existing file: ${path.join(targetDir, filename)}`);
      unlinkSync(path.join(targetDir, filename));
    }
    console.log(`Copying ${filename} to ${targetDir}`);
    // Copy the file from the generated API target directory to the target directory
    cpSync(path.join(generatedApiTargetDir, filename), path.join(targetDir, filename));
  });

  // STEP 5: clean up the temporary directory
  rmSync(tempDir, { recursive: true, force: true });
});
