#!/usr/bin/env node

/**
 * Fix coordinates by populating missing names from master CSV
 * Uses file+row to look up original association names
 */

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const csv = require('csv-stringify/sync');

const MASTER_FILE = './metadata/master_merged_all.csv';
const COORDS_FILE = './coordinates/holding_coordinates.csv';
const OUTPUT_FILE = './coordinates/holding_coordinates_fixed.csv';

console.log('========================================');
console.log('FIXING COORDINATE NAMES');
console.log('========================================');
console.log();

// Step 1: Read master CSV and index by filename + row
console.log('1. Reading master CSV...');
const masterContent = fs.readFileSync(MASTER_FILE, 'utf-8');
const masterRecords = parse(masterContent, {
  columns: true,
  skip_empty_lines: true,
});

const masterIndex = {};
masterRecords.forEach((record, idx) => {
  const file = record._file || 'unknown';
  const row = idx + 2; // +2 because row 1 is header, idx starts at 0
  const key = `${file}|${row}`;
  masterIndex[key] = {
    name: record.name,
    email: record.email,
    website: record.website,
  };
});

console.log(`   Indexed ${Object.keys(masterIndex).length} records`);
console.log();

// Step 2: Read coordinates and fix names
console.log('2. Fixing coordinate names...');
const coordContent = fs.readFileSync(COORDS_FILE, 'utf-8');
const coordRecords = parse(coordContent, {
  columns: true,
  skip_empty_lines: true,
});

let fixed = 0;
const fixedRecords = coordRecords.map((record) => {
  const key = `${record.file}|${record.row}`;
  const masterRecord = masterIndex[key];

  if (masterRecord && masterRecord.name && !record.name) {
    fixed++;
    return {
      ...record,
      name: masterRecord.name,
    };
  }

  return record;
});

console.log(`   Fixed ${fixed} records with names`);
console.log();

// Step 3: Write fixed coordinates
console.log('3. Writing fixed coordinates...');
const output = csv(fixedRecords);
fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');

console.log(`   Saved to: holding_coordinates_fixed.csv`);
console.log();

// Step 4: Summary
console.log('========================================');
console.log('DONE!');
console.log('========================================');
console.log(`Original coordinates: ${coordRecords.length}`);
console.log(`Fixed with names: ${fixed}`);
console.log(`Still empty: ${coordRecords.length - fixed}`);
console.log();
console.log('Next: Use holding_coordinates_fixed.csv for import');
