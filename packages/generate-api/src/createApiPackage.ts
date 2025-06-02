import * as path from 'path';
import {
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';

import {
  copySync,
  ensureDirSync,
  pathExistsSync,
} from 'fs-extra';

import {
  findPackageRootPath,
  findGitRootPath,
} from '@gen-epix/tools-lib';

const sourcePath = path.join(findPackageRootPath(), 'generated-api');
const destinationPath = path.join(findGitRootPath(), 'packages', 'core', 'src', 'api');

if (!pathExistsSync(sourcePath)) {
  throw Error('API source path does not exist');
}

// Delete and recrate destination path
rmSync(destinationPath, { recursive: true, force: true });
ensureDirSync(destinationPath);

// Copy files to destination
['index.ts', 'api.ts', 'base.ts', 'common.ts', 'configuration.ts'].forEach((filename) => {
  copySync(path.join(sourcePath, filename), path.join(destinationPath, filename));
});

console.log('Patching API');

const baseTsPath = path.join(destinationPath, 'base.ts');
const apiTsPath = path.join(destinationPath, 'api.ts');
const configurationTsPath = path.join(destinationPath, 'configuration.ts');
const commonTsPath = path.join(destinationPath, 'common.ts');
const indexTsPath = path.join(destinationPath, 'index.ts');

const replaceContent = (filePath: string, replacer: (oldContent: string) => string) => {
  writeFileSync(
    filePath,
    replacer(readFileSync(filePath, 'utf-8')),
    'utf-8',
  );
};

replaceContent(indexTsPath, content => `${content}
export * from "./base";
`);

replaceContent(commonTsPath, content => content
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

replaceContent(configurationTsPath, content => content
  .replace('/* tslint:disable */\n/* eslint-disable */', '/* eslint-disable */\n// @ts-nocheck')
  .replace(/basePath/g, 'baseUrl')
  .replace(/username\?: string;/g, `username?: string;
    defaultRequestTimeout?: number;`)
  .replace('this.formDataCtor = param.formDataCtor;', `this.formDataCtor = param.formDataCtor;
        this.defaultRequestTimeout = param.defaultRequestTimeout;`));

replaceContent(baseTsPath, content => content
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

replaceContent(apiTsPath, content => content
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
