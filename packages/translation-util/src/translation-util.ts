#!/usr/bin/env node

import path from 'path';
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'fs';

import { globSync } from 'glob';
import chalk from 'chalk';
import {
  createSourceFile,
  forEachChild,
  isIdentifier,
  isJsxAttribute,
  isJsxElement,
  isJsxExpression,
  isJsxFragment,
  isJsxSelfClosingElement,
  isJsxText,
  isPropertyAccessExpression,
  isStringLiteral,
  ScriptKind,
  ScriptTarget,
  type JsxChild,
  type JsxTagNameExpression,
  type Node,
  type NodeArray,
} from 'typescript';

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

// ---------------------------------------------------------------------------
// Trans component extraction helpers
// ---------------------------------------------------------------------------

const getJsxTagName = (tagName: JsxTagNameExpression): string => {
  if (isIdentifier(tagName)) {
    return tagName.text;
  }
  if (isPropertyAccessExpression(tagName)) {
    return tagName.name.text;
  }
  return tagName.getText();
};

const serializeJsxChildren = (children: NodeArray<JsxChild>): string => {
  let result = '';
  let elementIndex = 0;

  for (const child of children) {
    if (isJsxText(child)) {
      const text = child.text.trim();
      if (text) {
        result += text;
      }
    } else if (isJsxExpression(child)) {
      if (child.expression && isStringLiteral(child.expression)) {
        result += child.expression.text;
      }
    } else if (isJsxSelfClosingElement(child)) {
      const tagName = getJsxTagName(child.tagName);
      if (tagName.toLowerCase() === 'br') {
        result += '<br/>';
      } else {
        result += `<${elementIndex}/>`;
        elementIndex++;
      }
    } else if (isJsxElement(child)) {
      const tagName = getJsxTagName(child.openingElement.tagName);
      if (tagName.toLowerCase() === 'br') {
        result += '<br/>';
      } else {
        const inner = serializeJsxChildren(child.children);
        result += `<${elementIndex}>${inner}</${elementIndex}>`;
        elementIndex++;
      }
    } else if (isJsxFragment(child)) {
      const inner = serializeJsxChildren(child.children);
      result += `<${elementIndex}>${inner}</${elementIndex}>`;
      elementIndex++;
    }
  }

  return result;
};

const extractTransComponents = (filePath: string): Map<string, string> => {
  const result = new Map<string, string>();
  const source = readFileSync(filePath, 'utf-8');

  // Determine script kind: TSX for .tsx files, TS otherwise
  const scriptKind = filePath.endsWith('.tsx') ? ScriptKind.TSX : ScriptKind.TS;
  const sourceFile = createSourceFile(
    filePath,
    source,
    ScriptTarget.Latest,
    /* setParentNodes */ true,
    scriptKind,
  );

  const visit = (node: Node): void => {
    if (isJsxElement(node)) {
      const tagName = getJsxTagName(node.openingElement.tagName);
      if (tagName === 'Trans') {
        for (const attr of node.openingElement.attributes.properties) {
          if (isJsxAttribute(attr) && attr.name.getText(sourceFile) === 'i18nKey') {
            let key: string | undefined;
            if (attr.initializer) {
              if (isStringLiteral(attr.initializer)) {
                key = attr.initializer.text;
              } else if (
                isJsxExpression(attr.initializer) &&
                attr.initializer.expression &&
                isStringLiteral(attr.initializer.expression)
              ) {
                key = attr.initializer.expression.text;
              }
            }
            if (key) {
              const serialized = serializeJsxChildren(node.children);
              result.set(key, serialized);
            }
          }
        }
      }
    }
    forEachChild(node, visit);
  };

  visit(sourceFile);
  return result;
};

// ---------------------------------------------------------------------------

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
const transTranslations = new Map<string, string>();
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
  // Extract <Trans i18nKey="..."> components from TSX/TS files
  const transKeys = extractTransComponents(filePath);
  for (const [key, serialized] of transKeys) {
    newTranslations.add(key);
    transTranslations.set(key, serialized);
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
      const serializedTrans = transTranslations.get(key);
      if (serializedTrans !== undefined) {
        // For Trans components, use serialized JSX content for all locales.
        // Non-English locales get a ⚠ appended so translators know to adapt the text.
        json.translation[key] = localeCode === 'en' ? serializedTrans : `${serializedTrans} ⚠`;
      } else if (localeCode === 'en') {
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
