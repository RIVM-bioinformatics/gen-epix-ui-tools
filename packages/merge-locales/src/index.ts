import {
  resolve,
  sep,
} from 'path';

import { mergeLocales as mergeLocaleFiles } from './lib.js';
import type { MergeLocalesOptions } from './lib.js';

export type { MergeLocalesOptions } from './lib.js';

export interface MergeLocalesPlugin {
  buildStart: () => void;
  configResolved: (config: ResolvedConfig) => void;
  configureServer: (server: DevServer) => void;
  name: string;
}

interface DevServer {
  watcher: {
    add: (paths: string[]) => void;
    on: (event: 'add' | 'change' | 'unlink', handler: (filePath: string) => void) => void;
  };
  ws: {
    send: (payload: { path: string; type: 'full-reload' }) => void;
  };
}

interface ResolvedConfig {
  root: string;
}

export const mergeLocales = (options: MergeLocalesOptions): MergeLocalesPlugin => {
  let resolvedOptions: MergeLocalesOptions = {
    outputDirectory: resolve(options.outputDirectory),
    sourceDirectories: options.sourceDirectories.map(sourceDirectory => resolve(sourceDirectory)),
  };

  return {
    buildStart: () => {
      mergeLocaleFiles(resolvedOptions);
    },
    configResolved: (config) => {
      resolvedOptions = {
        outputDirectory: resolve(config.root, options.outputDirectory),
        sourceDirectories: options.sourceDirectories.map(sourceDirectory => resolve(config.root, sourceDirectory)),
      };
    },
    configureServer: (server) => {
      const mergeAndReload = (): void => {
        mergeLocaleFiles(resolvedOptions);
        server.ws.send({ path: '*', type: 'full-reload' });
      };

      mergeLocaleFiles(resolvedOptions);
      server.watcher.add(resolvedOptions.sourceDirectories);
      for (const event of ['add', 'change', 'unlink'] as const) {
        server.watcher.on(event, (filePath) => {
          const isLocaleFile = filePath.endsWith('.json');
          const isSourceFile = resolvedOptions.sourceDirectories.some(sourceDirectory => (
            filePath.startsWith(`${sourceDirectory}${sep}`)
          ));
          if (isLocaleFile && isSourceFile) {
            mergeAndReload();
          }
        });
      }
    },
    name: 'merge-locales',
  };
};
