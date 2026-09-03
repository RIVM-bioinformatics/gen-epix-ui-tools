import {
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import {
  basename,
  extname,
  join,
} from 'path';

export interface MergeLocalesOptions {
  outputDirectory: string;
  sourceDirectories: string[];
}

type JsonObject = { [key: string]: JsonValue };
type JsonValue = boolean | JsonObject | JsonValue[] | null | number | string;

const isJsonObject = (value: JsonValue): value is JsonObject => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const mergeJsonValues = (base: JsonValue, override: JsonValue): JsonValue => {
  if (!isJsonObject(base) || !isJsonObject(override)) {
    return override;
  }

  const merged: JsonObject = { ...base };
  for (const [key, value] of Object.entries(override)) {
    merged[key] = key in merged ? mergeJsonValues(merged[key], value) : value;
  }
  return merged;
};

const getErrorMessage = (error: unknown): string => (
  error instanceof Error ? error.message : JSON.stringify(error)
);

const readLocaleFiles = (sourceDirectory: string): Map<string, string[]> => {
  const localeFiles = new Map<string, string[]>();

  for (const entry of readdirSync(sourceDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || extname(entry.name) !== '.json') {
      continue;
    }

    const locale = basename(entry.name, '.json');
    const files = localeFiles.get(locale) ?? [];
    files.push(join(sourceDirectory, entry.name));
    localeFiles.set(locale, files);
  }

  return localeFiles;
};

export const getLocaleFilePaths = (sourceDirectories: string[]): string[] => (
  sourceDirectories.flatMap(sourceDirectory => [...readLocaleFiles(sourceDirectory).values()].flat())
);

const readJsonFile = (filePath: string): JsonValue => {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as JsonValue;
  } catch (error) {
    throw new Error(`Unable to parse locale file ${filePath}: ${getErrorMessage(error)}`, { cause: error });
  }
};

export const mergeLocales = ({ outputDirectory, sourceDirectories }: MergeLocalesOptions): string[] => {
  const locales = new Map<string, string[]>();

  for (const sourceDirectory of sourceDirectories) {
    let sourceLocales: Map<string, string[]>;
    try {
      sourceLocales = readLocaleFiles(sourceDirectory);
    } catch (error) {
      throw new Error(`Unable to read source directory ${sourceDirectory}: ${getErrorMessage(error)}`, { cause: error });
    }

    for (const [locale, files] of sourceLocales) {
      locales.set(locale, [...(locales.get(locale) ?? []), ...files]);
    }
  }

  if (locales.size === 0) {
    throw new Error('No locale JSON files found in the source directories.');
  }

  mkdirSync(outputDirectory, { recursive: true });
  const outputPaths: string[] = [];

  for (const [locale, files] of [...locales.entries()].sort(([first], [second]) => first.localeCompare(second))) {
    let merged: JsonValue = {};
    for (const file of files) {
      merged = mergeJsonValues(merged, readJsonFile(file));
    }

    const outputPath = join(outputDirectory, `${locale}.json`);
    writeFileSync(outputPath, `${JSON.stringify(merged, null, 2)}\n`);
    outputPaths.push(outputPath);
  }

  return outputPaths;
};
