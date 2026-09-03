import { resolve } from 'path';

import {
	getLocaleFilePaths,
	mergeLocales as mergeLocaleFiles,
} from './lib.js';
import type { MergeLocalesOptions } from './lib.js';

export type { MergeLocalesOptions } from './lib.js';
export interface MergeLocalesPlugin {
	buildStart: (this: PluginContext) => void;
	configResolved: (config: ResolvedConfig) => void;
	name: string;
}

interface PluginContext {
	addWatchFile: (file: string) => void;
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
		buildStart(this: PluginContext) {
			mergeLocaleFiles(resolvedOptions);
			for (const sourceFilePath of getLocaleFilePaths(resolvedOptions.sourceDirectories)) {
				this.addWatchFile(sourceFilePath);
			}
		},
		configResolved: (config) => {
			resolvedOptions = {
				outputDirectory: resolve(config.root, options.outputDirectory),
				sourceDirectories: options.sourceDirectories.map(sourceDirectory => resolve(config.root, sourceDirectory)),
			};
		},
		name: 'merge-locales',
	};
};
