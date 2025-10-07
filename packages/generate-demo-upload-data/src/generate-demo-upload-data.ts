#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  writeFileSync,
} from 'fs';
import * as path from 'path';
import * as readline from 'readline';

import readXlsxFile, { readSheetNames } from 'read-excel-file/node';

// Types
interface Arguments {
  input: string;
  output: string;
}

interface ColumnMapping {
  idColumn: string;
  seqColumn: string;
  readColumn: string;
  readFwdColumn: string;
  readRevColumn: string;
}

// Excel reading function
const readExcelHeaders = async (filePath: string): Promise<string[]> => {
  try {
    // First, get available sheet names
    const sheetNames = await readSheetNames(filePath);
    console.log(`\nAvailable sheets: ${sheetNames.join(', ')}`);

    // Use the first sheet by default
    const sheetName = sheetNames[0];
    console.log(`Reading headers from sheet: ${sheetName}`);

    // Read the first row to get headers
    const rows = await readXlsxFile(filePath, { sheet: sheetName });

    if (rows.length === 0) {
      throw new Error('Excel file is empty');
    }

    // Convert first row to strings and filter out null/undefined values
    const headers = rows[0]
      .map(cell => cell?.toString() || '')
      .filter(header => header.trim() !== '');

    return headers;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
};

// Read all Excel data
const readExcelData = async (filePath: string): Promise<unknown[][]> => {
  try {
    const sheetNames = await readSheetNames(filePath);
    const sheetName = sheetNames[0];

    const rows = await readXlsxFile(filePath, { sheet: sheetName });
    return rows;
  } catch (error) {
    console.error('Error reading Excel data:', error);
    throw error;
  }
};

// Generate random DNA sequence
const generateRandomSequence = (length: number): string => {
  const bases = ['A', 'T', 'C', 'G'];
  let sequence = '';
  for (let i = 0; i < length; i++) {
    sequence += bases[Math.floor(Math.random() * bases.length)];
  }
  return sequence;
};

// Generate random length between min and max
const getRandomLength = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};// Simple column selection function
const selectColumn = async (headers: string[], prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(`\nAvailable columns:`);
    headers.forEach((header, index) => {
      console.log(`${index + 1}. ${header}`);
    });
    console.log(`0. Skip this field`);

    rl.question(`\nSelect ${prompt} (enter number): `, (answer) => {
      const choice = parseInt(answer.trim());

      if (choice === 0) {
        console.log(`Skipping ${prompt}`);
        resolve('');
      } else if (choice >= 1 && choice <= headers.length) {
        const selected = headers[choice - 1];
        console.log(`Selected: ${selected}`);
        resolve(selected);
      } else {
        console.log('Invalid choice, skipping field');
        resolve('');
      }

      rl.close();
    });
  });
};

// Parse command line arguments
const parseArguments = (): Arguments => {
  const args = process.argv.slice(2);
  let inputPath = '';
  let outputPath = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && i + 1 < args.length) {
      inputPath = args[i + 1];
      i++;
    } else if (args[i] === '--output' && i + 1 < args.length) {
      outputPath = args[i + 1];
      i++;
    }
  }

  if (!inputPath || !outputPath) {
    console.error('Usage: generate-demo-upload-data --input <input-file> --output <output-folder>');
    process.exit(1);
  }

  if (!existsSync(inputPath)) {
    console.error(`Error: Input file does not exist: ${inputPath}`);
    process.exit(1);
  }

  return {
    input: path.resolve(inputPath),
    output: path.resolve(outputPath),
  };
};

// Generate individual files for each sequence/read column and row
const generateIndividualFiles = async (inputPath: string, outputPath: string, mapping: ColumnMapping, headers: string[]) => {
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath, { recursive: true });
  }

  // Read all Excel data
  const allRows = await readExcelData(inputPath);
  const dataRows = allRows.slice(1); // Skip header row

  // Find column indices
  const idColumnIndex = mapping.idColumn ? headers.indexOf(mapping.idColumn) : -1;
  const seqColumnIndex = mapping.seqColumn ? headers.indexOf(mapping.seqColumn) : -1;
  const readColumnIndex = mapping.readColumn ? headers.indexOf(mapping.readColumn) : -1;
  const readFwdColumnIndex = mapping.readFwdColumn ? headers.indexOf(mapping.readFwdColumn) : -1;
  const readRevColumnIndex = mapping.readRevColumn ? headers.indexOf(mapping.readRevColumn) : -1;

  console.log(`Processing ${dataRows.length} rows...`);
  let filesGenerated = 0;

  dataRows.forEach((row, rowIndex) => {
    const safeToString = (value: unknown): string => {
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
        return value.toString();
      }
      return '';
    };

    const idValue = idColumnIndex >= 0 ? (safeToString(row[idColumnIndex]) || `row${rowIndex + 1}`) : `row${rowIndex + 1}`;

    // Generate files for sequence column
    if (seqColumnIndex >= 0 && row[seqColumnIndex]) {
      const seqValue = safeToString(row[seqColumnIndex]);
      if (seqValue.trim()) {
        const randomLength = getRandomLength(100, 10000);
        const randomSequence = generateRandomSequence(randomLength);
        const filename = `id-${idValue}-col-${seqValue}.fa`;
        const filePath = path.join(outputPath, filename);
        const fastaContent = `>${idValue}\n${randomSequence}\n`;
        writeFileSync(filePath, fastaContent);
        filesGenerated++;
      }
    }

    // Generate files for read column
    if (readColumnIndex >= 0 && row[readColumnIndex]) {
      const readValue = safeToString(row[readColumnIndex]);
      if (readValue.trim()) {
        const randomLength = getRandomLength(100, 10000);
        const randomSequence = generateRandomSequence(randomLength);
        const filename = `id-${idValue}-col-${readValue}.fq`;
        const filePath = path.join(outputPath, filename);
        const fastqContent = `@${idValue}\n${randomSequence}\n+\n${'I'.repeat(randomLength)}\n`;
        writeFileSync(filePath, fastqContent);
        filesGenerated++;
      }
    }

    // Generate files for read forward column
    if (readFwdColumnIndex >= 0 && row[readFwdColumnIndex]) {
      const readFwdValue = safeToString(row[readFwdColumnIndex]);
      if (readFwdValue.trim()) {
        const randomLength = getRandomLength(100, 10000);
        const randomSequence = generateRandomSequence(randomLength);
        const filename = `id-${idValue}-col-${readFwdValue}.fq`;
        const filePath = path.join(outputPath, filename);
        const fastqContent = `@${idValue}\n${randomSequence}\n+\n${'I'.repeat(randomLength)}\n`;
        writeFileSync(filePath, fastqContent);
        filesGenerated++;
      }
    }

    // Generate files for read reverse column
    if (readRevColumnIndex >= 0 && row[readRevColumnIndex]) {
      const readRevValue = safeToString(row[readRevColumnIndex]);
      if (readRevValue.trim()) {
        const randomLength = getRandomLength(100, 10000);
        const randomSequence = generateRandomSequence(randomLength);
        const filename = `id-${idValue}-col-${readRevValue}.fq`;
        const filePath = path.join(outputPath, filename);
        const fastqContent = `@${idValue}\n${randomSequence}\n+\n${'I'.repeat(randomLength)}\n`;
        writeFileSync(filePath, fastqContent);
        filesGenerated++;
      }
    }
  });

  console.log(`Generated ${filesGenerated} files`);
};

// Main function
const main = async () => {
  console.log('Simple Demo Upload Data Generator');
  console.log('================================');

  const args = parseArguments();
  console.log(`Input file: ${args.input}`);
  console.log(`Output folder: ${args.output}`);

  // Get headers from Excel file
  const headers = await readExcelHeaders(args.input);

  // Interactive column selection
  console.log('\nColumn Selection:');
  const idColumn = await selectColumn(headers, 'ID Column');
  const seqColumn = await selectColumn(headers, 'Sequence Column');
  const readColumn = await selectColumn(headers, 'Read Column');
  const readFwdColumn = await selectColumn(headers, 'Read Forward Column');
  const readRevColumn = await selectColumn(headers, 'Read Reverse Column');

  const mapping: ColumnMapping = {
    idColumn,
    seqColumn,
    readColumn,
    readFwdColumn,
    readRevColumn,
  };

  console.log('\nColumn Mapping Summary:');
  console.log(`ID Column: ${mapping.idColumn || 'None'}`);
  console.log(`Sequence Column: ${mapping.seqColumn || 'None'}`);
  console.log(`Read Column: ${mapping.readColumn || 'None'}`);
  console.log(`Read Forward Column: ${mapping.readFwdColumn || 'None'}`);
  console.log(`Read Reverse Column: ${mapping.readRevColumn || 'None'}`);

  // Generate individual files for each row and column
  console.log('\nGenerating individual files...');
  await generateIndividualFiles(args.input, args.output, mapping, headers);
  console.log('Done!');
};

// Run the tool
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
