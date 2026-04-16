#!/usr/bin/env node
import * as path from 'path';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

import {
  APP,
  fetchOpenApiJson,
  sanitizeApiTs,
  sanitizeBaseTs,
  sanitizeCommonTs,
  sanitizeConfigurationTs,
  sanitizeIndexTs,
  sanitizeOpenApiJson,
} from './lib';

const appTypeStringToEnum = (appTypeString: string): APP => {
  switch (appTypeString) {
    case 'CASEDB':
      return APP.CASEDB;
    case 'OMOPDB':
      return APP.OMOPDB;
    case 'SEQDB':
      return APP.SEQDB;
    default:
      console.error(`Invalid app type: ${appTypeString}`);
      process.exit(1);
  }
};

const appTypesString = Object.values(APP).join('|');

if (process.argv.length !== 5) {
  console.error(`Usage: generate-api <${appTypesString}> <url> <targetDir>`);
  process.exit(1);
}

const appType = appTypeStringToEnum(process.argv[2]);
const url = process.argv[3];
const targetDir = path.join(process.cwd(), process.argv[4]);
const tempDir = mkdtempSync(path.join(tmpdir(), 'gen-epix-generate-api-'));
const require = createRequire(import.meta.url);


// STEP 1: copy the openapitools.json configuration file for the openapi-generator-cli
// If we don't do this the openapi-generator-cli will create it's own configuration which may be off a different version than the one we have in our package, which can lead to unexpected behavior.
// By copying our configuration file to the current working directory, we ensure that the openapi-generator-cli uses our specified configuration.
const openApiToolsConfigSourcePath = fileURLToPath(new URL('../openapitools.json', import.meta.url));
const openApiToolsConfigDestPath = path.join(process.cwd(), 'openapitools.json');

// if paths are the same, skip copying (this happens when the script is run from the generate-api package itself)
if (openApiToolsConfigSourcePath === openApiToolsConfigDestPath) {
  console.log('openapitools.json is already in the current working directory, skipping copy');
} else {
  if (existsSync(openApiToolsConfigDestPath)) {
    console.log(`Removing existing openapitools.json at ${openApiToolsConfigDestPath}`);
    unlinkSync(openApiToolsConfigDestPath);
  }
  console.log(`Copying openapitools.json to ${openApiToolsConfigDestPath}`);
  cpSync(openApiToolsConfigSourcePath, openApiToolsConfigDestPath);
}


// STEP 2: fetch json, sanitize it and write it to a file
// eslint-disable-next-line @typescript-eslint/no-floating-promises
fetchOpenApiJson(url).catch((error: unknown) => {
  console.error('Error fetching OpenAPI JSON:', error);
  process.exit(1);
}).then(jsonContent => {
  const sanitizedOpenApiJson = sanitizeOpenApiJson(jsonContent);
  const sanitizedOpenApiJsonPath = path.join(tempDir, 'api.sanitized.json');

  console.log('Writing to', sanitizedOpenApiJsonPath);
  writeFileSync(sanitizedOpenApiJsonPath, JSON.stringify(sanitizedOpenApiJson), 'utf-8');


  // STEP 3: run the openapi-generator-cli to generate the API client
  const openApiGeneratorCliBinPath = path.join(
    path.dirname(require.resolve('@openapitools/openapi-generator-cli/package.json')),
    'main.js',
  );
  const generatedApiTargetDir = path.join(tempDir, 'generated');
  const openApiGeneratorCommand = `${openApiGeneratorCliBinPath} generate -i ${sanitizedOpenApiJsonPath} -g typescript-axios --additional-properties="enumPropertyNaming=original" -o ${generatedApiTargetDir}`;

  console.log('Running command:', openApiGeneratorCommand);
  execSync(openApiGeneratorCommand, { stdio: 'inherit' });

  // STEP 4: post process the generated api
  console.log('Patching generated API files...');
  sanitizeIndexTs(path.join(generatedApiTargetDir, 'index.ts'));
  sanitizeCommonTs(path.join(generatedApiTargetDir, 'common.ts'), appType);
  sanitizeConfigurationTs(path.join(generatedApiTargetDir, 'configuration.ts'));
  sanitizeBaseTs(path.join(generatedApiTargetDir, 'base.ts'), appType);
  sanitizeApiTs(path.join(generatedApiTargetDir, 'api.ts'), appType, ['Subject', 'Filter'], 'Epi');

  // STEP 5: copy the generated files to the target directory
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

  // STEP 6: clean up the temporary directory
  rmSync(tempDir, { force: true, recursive: true });
});
