import * as path from 'path';
import {
  existsSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { Agent } from 'https';
import { execSync } from 'child_process';

import type { OpenAPIV3_1 } from 'openapi-types';
import fetch from 'node-fetch';

import { findGitRootPath } from '@gen-epix/tools-lib';

type JSONObject = | null | boolean | string | number | JSONObject[] | { [key: string]: JSONObject };
type AnyOfItem = { type: string; nullable: boolean; $ref: string };
type AnyOfLeaf = AnyOfItem[];

const agent = new Agent({
  rejectUnauthorized: false,
});
const jsonResponse = await fetch('https://127.0.0.1:8000/openapi.json', {
  agent,
});
const jsonResponseText = await jsonResponse.text();
const jsonContent = JSON.parse(jsonResponseText.replaceAll('anyOf', 'oneOf')) as JSONObject;
const sanitizedJsonPath = path.join(findGitRootPath(), 'api.sanitized.json');

const sanitizeJsonAttributes = (leaf: JSONObject): JSONObject => {
  if (Array.isArray(leaf)) {
    leaf.forEach((node, index) => {
      leaf[index] = sanitizeJsonAttributes(node);
    });
  } else if (typeof leaf === 'object') {
    delete leaf.default;
    delete leaf.const;
    delete leaf.uniqueItems;
    for (const key in leaf) {
      const value = leaf[key];

      // remove the user property from responses
      if (!isNaN(Number(key))) {
        delete (value as { user: string }).user;
      }

      if (key === 'operationId') {
        const splitValue = (value as string).split('_');
        if (splitValue.indexOf('api') > 1) {
          leaf[key] = (value as string).replace(/_api.*$/, '');
        } else {
          leaf[key] = value;
        }
        continue;
      }

      // convert anyOf where the anyOf array includes an item with type "null"
      if (key === 'oneOf' && Array.isArray(value) && (value as AnyOfLeaf).find(x => x.type === 'null')) {
        const replacementValue = (value as AnyOfLeaf).find(x => x.type !== 'null');
        replacementValue.type = replacementValue.$ref ? undefined : replacementValue.type || 'object';
        replacementValue.nullable = true;
        return replacementValue;
      }

      if (key === 'prefixItems') {
        leaf.oneOf = sanitizeJsonAttributes(value);
        delete leaf.type;
        delete leaf.minItems;
        delete leaf.maxItems;
        delete leaf.prefixItems;
        continue;
      }

      leaf[key] = sanitizeJsonAttributes(value);
    }
  }

  return leaf;
};

const sanitizeJson = (json: JSONObject): JSONObject => {
  // Generation using 3.1.0 specs is in development and is not officially supported yet.
  (json as unknown as OpenAPIV3_1.Document).openapi = '3.0.0';
  delete (json as unknown as OpenAPIV3_1.Document).info.summary;
  delete (json as unknown as OpenAPIV3_1.Document).info.license;
  delete (json as unknown as OpenAPIV3_1.Document).components.securitySchemes;

  return sanitizeJsonAttributes(json);
};

const sanitizedJson = sanitizeJson(jsonContent);
if (existsSync(sanitizedJsonPath)) {
  unlinkSync(sanitizedJsonPath);
}
console.log('Writing to', sanitizedJsonPath);
writeFileSync(sanitizedJsonPath, JSON.stringify(sanitizedJson), 'utf-8');


const binPath = path.join(findGitRootPath(), 'node_modules', '.bin', 'openapi-generator-cli');
const command = `${binPath} ${sanitizedJsonPath} -g typescript-axios --additional-properties="enumPropertyNaming=original" -o generated-api`;
execSync(command, { stdio: 'inherit' });
