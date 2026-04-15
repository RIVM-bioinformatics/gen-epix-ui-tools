import {
  readFileSync,
  writeFileSync,
} from 'fs';
import { Agent } from 'https';

import fetch from 'node-fetch';
import type { OpenAPIV3_1 } from 'openapi-types';

export enum APP {
  CASEDB = 'CASEDB',
  OMOPDB = 'OMOPDB',
  SEQDB = 'SEQDB',
}
export type AnyOfItem = { $ref: string; nullable: boolean; type: string };
export type AnyOfLeaf = AnyOfItem[];

export type JSONObject = { [key: string]: JSONObject } | boolean | JSONObject[] | number | string;


const appTypeToApiPrefix = (appType: APP): string => {
  switch (appType) {
    case APP.CASEDB:
      return 'CaseDb';
    case APP.OMOPDB:
      return 'OmopDb';
    case APP.SEQDB:
      return 'SeqDb';
    default:
      console.error(`Invalid app type: ${appType as string}`);
      process.exit(1);
  }
};

const sanitizeJsonAttributes = (leaf: JSONObject): JSONObject => {
  if (Array.isArray(leaf)) {
    leaf.forEach((node, index) => {
      leaf[index] = sanitizeJsonAttributes(node);
    });
  } else if (typeof leaf === 'object') {
    delete leaf.default;
    delete leaf.const;
    delete leaf.uniqueItems;
    delete leaf.propertyNames;
    for (const key in leaf) {
      const value = leaf[key];

      // remove the user property from responses
      if (!isNaN(Number(key))) {
        delete (value as { user: string }).user;
      }

      if (leaf.contentMediaType) {
        delete leaf.contentMediaType;
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

export const sanitizeOpenApiJson = (json: JSONObject): JSONObject => {
  // Generation using 3.1.0 specs is in development and is not officially supported yet.
  (json as unknown as OpenAPIV3_1.Document).openapi = '3.0.0';
  delete (json as unknown as OpenAPIV3_1.Document).info.summary;
  delete (json as unknown as OpenAPIV3_1.Document).info.license;
  delete (json as unknown as OpenAPIV3_1.Document).components.securitySchemes;

  return sanitizeJsonAttributes(json);
};

export const fetchOpenApiJson = async (url: string): Promise<JSONObject> => {
  try {
    const agent = new Agent({
      rejectUnauthorized: false,
    });
    const jsonResponse = await fetch(url, {
      agent,
    });
    const jsonResponseText = await jsonResponse.text();
    return JSON.parse(jsonResponseText.replaceAll('anyOf', 'oneOf')) as JSONObject;
  } catch (_error) {
    console.error(`Error fetching OpenAPI JSON at ${url}.`);
    process.exit(1);
  }
};

const sanitizeTs = (filePath: string, replacer: (oldContent: string) => string) => {
  console.log(`Sanitizing TypeScript file: ${filePath}`);
  writeFileSync(
    filePath,
    replacer(readFileSync(filePath, 'utf-8')),
    'utf-8',
  );
};

export const sanitizeIndexTs = (indexTsPath: string): void => {
  sanitizeTs(indexTsPath, content => `${content}
export * from "./base";
`);
};

export const sanitizeCommonTs = (commonTsPath: string, appType: APP): void => {
  const apiPrefix = appTypeToApiPrefix(appType);

  sanitizeTs(commonTsPath, content => content
    .replace('/* tslint:disable */\n/* eslint-disable */', '/* eslint-disable */\n// @ts-nocheck')
    .replace('import { RequiredError } from "./base";', `import { ${apiPrefix}BaseAPI, RequiredError } from "./base";`)
    .replace(`import type { AxiosInstance, AxiosResponse } from 'axios';`, `import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { isAxiosError } from 'axios';`)
    .replace(', basePath: string = BASE_PATH', '')
    .replace('BASE_PATH: string, ', '')
    .replace('export const createRequestFunction = function (axiosArgs: RequestArgs, globalAxios: AxiosInstance, configuration?: Configuration) {', 'export const createRequestFunction = function (axiosArgs: RequestArgs, globalAxios: AxiosInstance, _configuration?: Configuration) {')
    .replace(/const axiosRequestArgs.*;$/gm, `
  const axiosRequestArgs: AxiosRequestConfig = {
    ...axiosArgs.options,
    url: axiosArgs.url,
    timeout: ${apiPrefix}BaseAPI.defaultRequestTimeout,
    baseURL: ${apiPrefix}BaseAPI.baseUrl,
    headers: {
      ...(axiosArgs.options.headers || {}),
    },
    validateStatus: (code) => code >= 200 && code < 300,
  };
  `).replace('return axios.request<T, R>(axiosRequestArgs);', `
  return axios.request<T, R>(axiosRequestArgs).then((res) => {
    if (isAxiosError(res)) {
      throw res;
    }
    return res;
  });
  `));
};

export const sanitizeConfigurationTs = (configurationTsPath: string): void => {
  sanitizeTs(configurationTsPath, content => content
    .replace('/* tslint:disable */\n/* eslint-disable */', '/* eslint-disable */\n// @ts-nocheck')
    .replace(/basePath/g, 'baseUrl')
    .replace(/username\?: string;/g, `username?: string;
    defaultRequestTimeout?: number;`)
    .replace('this.formDataCtor = param.formDataCtor;', `this.formDataCtor = param.formDataCtor;
        this.defaultRequestTimeout = param.defaultRequestTimeout;`));
};

export const sanitizeBaseTs = (baseTsPath: string, appType: APP): void => {
  const apiPrefix = appTypeToApiPrefix(appType);

  sanitizeTs(baseTsPath, content => content
    .replace('/* tslint:disable */\n/* eslint-disable */', '/* eslint-disable */')
    .replace(/export const BASE_PATH.*/, 'export const BASE_PATH = "";')
    .replace('import type { Configuration }', 'import { Configuration }')
    .replace(`import type { AxiosPromise, AxiosInstance, AxiosRequestConfig } from 'axios';`, `import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';`)
    .replace(/export class BaseAPI {[\s\S]*};/gm, `export class ${apiPrefix}BaseAPI {
    public static defaultRequestTimeout: number;
    public static baseUrl: string;
    public static onRequest: Array<(request: InternalAxiosRequestConfig) => InternalAxiosRequestConfig<unknown>> = [];
    public static onResponseFulfilled: Array<(response: AxiosResponse) => AxiosResponse> = [];
    public static onResponseRejected: Array<(error: unknown) => void> = [];    public static accessToken: string;
  
    protected configuration = new Configuration();
    protected axios: AxiosInstance;
  
    public constructor() {
      this.axios = globalAxios.create();
      this.axios.interceptors.request.use(request => {
        if (${apiPrefix}BaseAPI.onRequest?.length) {
          return ${apiPrefix}BaseAPI.onRequest.reduce((prev, curr) => {
            return curr(prev);
          }, request);
        }
        return request;
      });
      this.axios.interceptors.response.use(response => {
        if (${apiPrefix}BaseAPI.onResponseFulfilled?.length) {
          ${apiPrefix}BaseAPI.onResponseFulfilled.reduce((prev, curr) => {
            return curr(prev);
          }, response)
        }
        return response;
      }, (err: unknown) => {
        if (${apiPrefix}BaseAPI.onResponseRejected?.length) {
          ${apiPrefix}BaseAPI.onResponseRejected.forEach(cb => cb(err));
        }
        return err;
      });
    }
};
`));
};

export const sanitizeApiTs = (apiTsPath: string, appType: APP, reservedWords: string[], reservedWordPrefix: string): void => {
  const apiPrefix = appTypeToApiPrefix(appType);

  sanitizeTs(apiTsPath, content => {
    let newContent = content
      .replace('/* tslint:disable */\n/* eslint-disable */', '/* eslint-disable */\n// @ts-nocheck')
      .replace(/export const (.*?)ApiAxiosParamCreator/g, `const ${apiPrefix}$1ApiAxiosParamCreator`)
      .replace(/const localVarAxiosParamCreator = (.*?)ApiAxiosParamCreator\(configuration\)/g, `const localVarAxiosParamCreator = ${apiPrefix}$1ApiAxiosParamCreator(configuration)`)
      .replace(/BASE_PATH, configuration/g, 'configuration')
      .replace(/export const (.*?)ApiFp/g, `const ${apiPrefix}$1ApiFp`)
      .replace(/return (.*?)ApiFp\(this.configuration\)/g, `return ${apiPrefix}$1ApiFp(this.configuration)`)
      // NOTE: disable the use of cascading because of cash invalidation problems
      .replace(/cascade\?: boolean/g, 'cascade?: false')
      .replace(/Enum|enum/g, '')
      .replace('setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, ', '')
      .replace(/\* @memberof (.*?)Api/g, `* @memberof ${apiPrefix}$1Api`)
      .replace(/export const (.*)ApiFactory[\s\S]*?object-oriented interface/g, `
/**
 * ${apiPrefix}$1Api - object-oriented interface
`).replace(/export class (.*)Api extends BaseAPI {/g, `export class ${apiPrefix}$1Api extends BaseAPI {
  private static __instance: ${apiPrefix}$1Api;
  public static get instance(): ${apiPrefix}$1Api {
    ${apiPrefix}$1Api.__instance = ${apiPrefix}$1Api.__instance || new ${apiPrefix}$1Api();
    return ${apiPrefix}$1Api.__instance;
  }
`).replace(/this\.basePath/g, 'this.configuration.baseUrl')
      .replace(/BaseAPI/g, `${apiPrefix}BaseAPI`);

    reservedWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      newContent = newContent.replace(regex, `${reservedWordPrefix}${String(word).charAt(0).toUpperCase() + String(word).slice(1)}`);
    });

    // get all matches of:
    // "export type (\w)" and "export interface (\w)" and prefix all occurrences of the captured word with the api prefix, do this once per captured word
    const typeInterfaceRegex = /export (type|interface) (\w+)/g;
    const matches = newContent.matchAll(typeInterfaceRegex);
    const capturedWords = new Set<string>();
    for (const match of matches) {
      const capturedWord = match[2];
      if (!capturedWords.has(capturedWord)) {
        const regex = new RegExp(`\\b${capturedWord}\\b`, 'g');
        newContent = newContent.replace(regex, `${apiPrefix}${capturedWord}`);
        capturedWords.add(capturedWord);
      }
    }


    return newContent;
  });
};
