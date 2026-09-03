import {
  resolve,
  sep,
} from 'path';

import { mergeLocales as mergeLocaleFiles } from './lib.js';
import type { MergeLocalesOptions } from './lib.js';

export type { MergeLocalesOptions } from './lib.js';

export interface MergeLocalesPlugin {
  configResolved: (config: ResolvedConfig) => void;
  configureServer: (server: DevServer) => void;
  generateBundle: (this: EmitFileContext) => void;
  name: string;
}

interface DevServer {
  middlewares: {
    use: (handler: (request: ServerRequest, response: ServerResponse, next: () => void) => void) => void;
  };
  watcher: {
    add: (paths: string[]) => void;
    on: (event: 'add' | 'change' | 'unlink', handler: (filePath: string) => void) => void;
  };
  ws: {
    send: (payload: { path: string; type: 'full-reload' }) => void;
  };
}

interface EmitFileContext {
  emitFile: (file: { fileName: string; source: string; type: 'asset' }) => void;
}

interface ResolvedConfig {
  root: string;
}

interface ServerRequest {
  url?: string;
}

interface ServerResponse {
  end: (chunk: string) => void;
  setHeader: (name: string, value: string) => void;
  statusCode: number;
}

const trimSlashes = (value: string): string => value.replace(/^[./]+/, '').replace(/\/+$/, '');

export const mergeLocales = (options: MergeLocalesOptions): MergeLocalesPlugin => {
  const outputPath = trimSlashes(options.outputPath);
  let sourceDirectories = options.sourceDirectories.map(sourceDirectory => resolve(sourceDirectory));

  return {
    configResolved: (config) => {
      sourceDirectories = options.sourceDirectories.map(sourceDirectory => resolve(config.root, sourceDirectory));
    },
    configureServer: (server) => {
      server.watcher.add(sourceDirectories);
      for (const event of ['add', 'change', 'unlink'] as const) {
        server.watcher.on(event, (filePath) => {
          const isLocaleFile = filePath.endsWith('.json');
          const isSourceFile = sourceDirectories.some(sourceDirectory => (
            filePath.startsWith(`${sourceDirectory}${sep}`)
          ));
          if (isLocaleFile && isSourceFile) {
            server.ws.send({ path: '*', type: 'full-reload' });
          }
        });
      }

      server.middlewares.use((request, response, next) => {
        const pathname = (request.url ?? '').split('?')[0];
        const match = new RegExp(`(?:^|/)${outputPath}/([^/]+)\\.json$`).exec(pathname);
        const source = match ? mergeLocaleFiles(sourceDirectories).get(match[1]) : undefined;

        if (source === undefined) {
          next();
          return;
        }

        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Cache-Control', 'no-cache');
        response.end(source);
      });
    },
    generateBundle: function emitLocales() {
      for (const [locale, source] of mergeLocaleFiles(sourceDirectories)) {
        this.emitFile({
          fileName: `${outputPath}/${locale}.json`,
          source,
          type: 'asset',
        });
      }
    },
    name: 'merge-locales',
  };
};
