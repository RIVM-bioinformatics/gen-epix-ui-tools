#!/usr/bin/env node

import path from 'path';
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'fs';

import { globSync } from 'glob';
import chalk from 'chalk';

import { findGitRootPath } from '@gen-epix/tools-lib';

type TranslationCounts = Record<string, { missing: number; stale: number }>;

const printTranslationTable = (
  missingPerLocale: Record<string, string[]>,
  stalePerLocale: Record<string, string[]>,
  localeCodes: string[],
  afterCounts?: TranslationCounts,
) => {
  console.log(`\n${chalk.bold.cyan('Translation Status Report')}`);
  console.log(`${chalk.gray('='.repeat(50))}\n`);

  const maxLocaleLength = Math.max(...localeCodes.map(l => l.length), 6);

  if (afterCounts) {
    const header = chalk.bold.white(`${'Locale'.padEnd(maxLocaleLength)} | ${'Missing'.padStart(7)} -> ${'After'.padStart(5)} | ${'Stale'.padStart(5)} -> ${'After'.padStart(5)}`);
    console.log(header);
    console.log(chalk.gray('-'.repeat(maxLocaleLength + 36)));
    for (const localeCode of localeCodes) {
      const missing = missingPerLocale[localeCode]?.length ?? 0;
      const stale = stalePerLocale[localeCode]?.length ?? 0;
      const missingAfter = afterCounts[localeCode]?.missing ?? 0;
      const staleAfter = afterCounts[localeCode]?.stale ?? 0;
      const missingStr = (missing > 0 ? chalk.yellow : chalk.green)(String(missing).padStart(7));
      const missingAfterStr = (missingAfter > 0 ? chalk.yellow : chalk.green)(String(missingAfter).padStart(5));
      const staleStr = (stale > 0 ? chalk.red : chalk.green)(String(stale).padStart(5));
      const staleAfterStr = (staleAfter > 0 ? chalk.red : chalk.green)(String(staleAfter).padStart(5));
      console.log(`${localeCode.padEnd(maxLocaleLength)} | ${missingStr} -> ${missingAfterStr} | ${staleStr} -> ${staleAfterStr}`);
    }
  } else {
    const header = chalk.bold.white(`${'Locale'.padEnd(maxLocaleLength)} | ${'Missing'.padStart(7)} | ${'Stale'.padStart(5)}`);
    console.log(header);
    console.log(chalk.gray('-'.repeat(maxLocaleLength + 18)));
    for (const localeCode of localeCodes) {
      const missing = missingPerLocale[localeCode]?.length ?? 0;
      const stale = stalePerLocale[localeCode]?.length ?? 0;
      const missingStr = (missing > 0 ? chalk.yellow : chalk.green)(String(missing).padStart(7));
      const staleStr = (stale > 0 ? chalk.red : chalk.green)(String(stale).padStart(5));
      console.log(`${localeCode.padEnd(maxLocaleLength)} | ${missingStr} | ${staleStr}`);
    }
  }

  const allUpToDate = localeCodes.every(lc => (missingPerLocale[lc]?.length ?? 0) === 0 && (stalePerLocale[lc]?.length ?? 0) === 0);
  if (allUpToDate) {
    console.log(`\n${chalk.green('✓ All translations are up to date!')}`);
  }
  console.log();
};

type TranslationFileContent = {
  translation: Record<string, string>;
};

const regexes = [
  /\bt\(\s*'([^']*)'\s*(?=,|\))/g,
  /\bt`([^`]+)`/g,
];

if (process.argv.length < 3 || process.argv.length > 6) {
  console.error('Usage: translation-util <packageDir> [--dry-run] [--fail-on-missing] [--fail-on-stale]');
  process.exit(1);
}

const packageDir = process.argv[2];
const isDryRun = process.argv.includes('--dry-run');
const failOnMissing = process.argv.includes('--fail-on-missing');
const failOnStale = process.argv.includes('--fail-on-stale');

if ((failOnMissing || failOnStale) && !isDryRun) {
  console.error('Error: --fail-on-missing and --fail-on-stale can only be used with --dry-run');
  process.exit(1);
}

const srcPath = path.join(findGitRootPath(), packageDir, 'src');
const localePath = path.join(findGitRootPath(), packageDir, 'src', 'locale');

if (!existsSync(srcPath)) {
  console.error(`Source directory not found: ${srcPath}`);
  process.exit(1);
}
if (!existsSync(localePath)) {
  console.error(`Locales directory not found: ${localePath}`);
  process.exit(1);
}

const localeFiles = globSync('*.json', { cwd: localePath });
const localeCodes = localeFiles.map(file => path.parse(file).name);

const existingTranslationsPerLocale: Record<string, Set<string>> = {};
for (const localeCode of localeCodes) {
  const localeFilePath = path.join(localePath, `${localeCode}.json`);
  const content = readFileSync(localeFilePath, 'utf-8');
  const json = JSON.parse(content) as TranslationFileContent;
  existingTranslationsPerLocale[localeCode] = new Set(Object.entries(json.translation).filter(([, v]) => v !== '').map(([k]) => k));
}

const newTranslations = new Set<string>();
const files = globSync('**/*.{ts,tsx}', { cwd: srcPath });
for (const file of files) {
  const filePath = path.join(srcPath, file);
  const content = readFileSync(filePath, 'utf-8');
  for (const regex of regexes) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      newTranslations.add(match[1]);
    }
  }
}

const missingTranslationsPerLocale: Record<string, string[]> = {};
for (const localeCode of localeCodes) {
  const existingTranslations = existingTranslationsPerLocale[localeCode];
  const missingTranslations = Array.from(newTranslations).filter(t => !existingTranslations.has(t));
  missingTranslationsPerLocale[localeCode] = missingTranslations;
}

const staleTranslationsPerLocale: Record<string, string[]> = {};
for (const localeCode of localeCodes) {
  const existingTranslations = existingTranslationsPerLocale[localeCode];
  const staleTranslations = Array.from(existingTranslations).filter(t => !newTranslations.has(t));
  staleTranslationsPerLocale[localeCode] = staleTranslations;
}

if (isDryRun) {
  console.log(chalk.bold.yellow('🔍 Dry run mode - no files will be modified'));
  printTranslationTable(missingTranslationsPerLocale, staleTranslationsPerLocale, localeCodes);
  if (failOnMissing) {
    const hasMissing = localeCodes.some(lc => (missingTranslationsPerLocale[lc]?.length ?? 0) > 0);
    if (hasMissing) {
      console.error(chalk.bold.red('❌ Missing translations found. Exiting with error.'));
      process.exit(1);
    }
  }
  if (failOnStale) {
    const hasStale = localeCodes.some(lc => (staleTranslationsPerLocale[lc]?.length ?? 0) > 0);
    if (hasStale) {
      console.error(chalk.bold.red('❌ Stale translations found. Exiting with error.'));
      process.exit(1);
    }
  }
} else {
  // Update locale files with new translations and remove stale ones
  for (const localeCode of localeCodes) {
    const localeFilePath = path.join(localePath, `${localeCode}.json`);
    const content = readFileSync(localeFilePath, 'utf-8');
    const json = JSON.parse(content) as TranslationFileContent;

    // Add missing translations with empty values
    const missingTranslations = missingTranslationsPerLocale[localeCode];
    for (const key of missingTranslations) {
      if (localeCode === 'en') {
        json.translation[key] = key; // For English, use the key as the default translation
      } else {
        json.translation[key] = `${key} ⚠`; // For other locales, add a placeholder
      }
    }

    // Remove stale translations
    const staleTranslations = staleTranslationsPerLocale[localeCode];
    for (const key of staleTranslations) {
      delete json.translation[key];
    }

    // Sort translation keys alphabetically
    json.translation = Object.fromEntries(Object.entries(json.translation).sort(([a], [b]) => a.localeCompare(b)));

    // Write updated locale file
    writeFileSync(localeFilePath, `${JSON.stringify(json, null, 2)}\n`, 'utf-8');
  }
  console.log(chalk.bold.green('✅ Files updated successfully!'));
  const afterCounts: TranslationCounts = Object.fromEntries(
    localeCodes.map(localeCode => [localeCode, { missing: 0, stale: 0 }]),
  );
  printTranslationTable(missingTranslationsPerLocale, staleTranslationsPerLocale, localeCodes, afterCounts);
}
