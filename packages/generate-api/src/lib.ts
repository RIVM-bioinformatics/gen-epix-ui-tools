import {
  writeFileSync,
  readFileSync,
} from 'fs';
import { Agent } from 'https';

import fetch from 'node-fetch';
import type { OpenAPIV3_1 } from 'openapi-types';


export type JSONObject = | null | boolean | string | number | JSONObject[] | { [key: string]: JSONObject };
export type AnyOfItem = { type: string; nullable: boolean; $ref: string };
export type AnyOfLeaf = AnyOfItem[];

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

export const sanitizeCommonTs = (commonTsPath: string): void => {
  sanitizeTs(commonTsPath, content => content
    .replace('/* tslint:disable */\n/* eslint-disable */', '/* eslint-disable */\n// @ts-nocheck')
    .replace(`import type { AxiosInstance, AxiosResponse } from 'axios';`, `import { type AxiosInstance, type AxiosResponse, type AxiosRequestConfig, isAxiosError } from 'axios';`)
    .replace('import { RequiredError } from "./base";', 'import { BaseAPI, RequiredError } from "./base";')
    .replace(', basePath: string = BASE_PATH', '')
    .replace('BASE_PATH: string, ', '')
    .replace('export const createRequestFunction = function (axiosArgs: RequestArgs, globalAxios: AxiosInstance, configuration?: Configuration) {', 'export const createRequestFunction = function (axiosArgs: RequestArgs, globalAxios: AxiosInstance, _configuration?: Configuration) {')
    .replace(/const axiosRequestArgs.*;$/gm, `
  const axiosRequestArgs: AxiosRequestConfig = {
    ...axiosArgs.options,
    url: axiosArgs.url,
    timeout: BaseAPI.defaultRequestTimeout,
    baseURL: BaseAPI.baseUrl,
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

export const sanitizeBaseTs = (baseTsPath: string): void => {
  sanitizeTs(baseTsPath, content => content
    .replace('/* tslint:disable */\n/* eslint-disable */', '/* eslint-disable */\n// @ts-nocheck')
    .replace(/export const BASE_PATH.*/, 'export const BASE_PATH = "";')
    .replace('import type { Configuration }', 'import { Configuration }')
    .replace(`import type { AxiosPromise, AxiosInstance, AxiosRequestConfig } from 'axios';`, `import type { AxiosPromise, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from 'axios';`)
    .replace(/export class BaseAPI {[\s\S]*};/gm, `export class BaseAPI {
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
        if (BaseAPI.onRequest?.length) {
          return BaseAPI.onRequest.reduce((prev, curr) => {
            return curr(prev);
          }, request);
        }
        return request;
      });
      this.axios.interceptors.response.use(response => {
        if (BaseAPI.onResponseFulfilled?.length) {
          BaseAPI.onResponseFulfilled.reduce((prev, curr) => {
            return curr(prev);
          }, response)
        }
        return response;
      }, (err: unknown) => {
        if (BaseAPI.onResponseRejected?.length) {
          BaseAPI.onResponseRejected.forEach(cb => cb(err));
        }
        return err;
      });
    }
};
`));
};

export const sanitizeApiTs = (apiTsPath: string): void => {
  sanitizeTs(apiTsPath, content => content
    .replace('/* tslint:disable */\n/* eslint-disable */', '/* eslint-disable */\n// @ts-nocheck')
    .replace(/export const (.*?)ApiAxiosParamCreator/g, 'const $1ApiAxiosParamCreator')
    .replace(/BASE_PATH, configuration/g, 'configuration')
    .replace(/export const (.*?)ApiFp/g, 'const $1ApiFp')
    // NOTE: disable the use of cascading because of cash invalidation problems
    .replace(/cascade\?: boolean/g, 'cascade?: false')
    .replace(/Enum|enum/g, '')
    .replace('setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, ', '')
    .replace(/export const (.*)ApiFactory[\s\S]*?object-oriented interface/g, `
/**
 * $1Api - object-oriented interface
`).replace(/export class (.*)Api extends BaseAPI {/g, `export class $1Api extends BaseAPI {
  public static instance: $1Api;
  public static getInstance(): $1Api {
    this.instance = this.instance || new $1Api();
    return this.instance;
  }
`).replace(/this\.basePath/g, 'this.configuration.baseUrl'));
};
