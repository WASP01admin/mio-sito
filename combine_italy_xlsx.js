#!/usr/bin/env node

/**
 * Combine all Italian regional XLSX files into one CSV
 * Keep headers clean - only one header row for the entire file
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const INPUT_DIR = 'C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\ITALY ONLY';
const OUTPUT_FILE = path.join(INPUT_DIR, 'Italy_All_Regions_Combined.csv');

function combineItalyFiles() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  COMBINING ITALIAN REGIONAL FILES      ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Get all XLSX files
  console.log('1. Reading all XLSX files from folder...');
  const files = fs.readdirSync(INPUT_DIR)
    .filter(f => f.toLowerCase().endsWith('.xlsx'))
    .sort();

  console.log(`   Found ${files.length} files\n`);

  // Combine data
  console.log('2. Combining data...');
  let allRows = [];
  let headers = null;
  let headerSet = false;

  files.forEach((file, idx) => {
    try {
      const filePath = path.join(INPUT_DIR, file);
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        console.log(`   ⚠️  ${file}: No data`);
        return;
      }

      // Get headers from first file
      if (!headerSet) {
        headers = Object.keys(data[0]);
        headerSet = true;
        console.log(`   ✓ Headers from ${file}:`);
        console.log(`     ${headers.join(' | ')}\n`);
      }

      // Add all rows from this file
      data.forEach(row => {
        const csvRow = headers.map(h => {
          const val = row[h];
          if (!val) return '';
          // Escape CSV values
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
        allRows.push(csvRow.join(','));
      });

      console.log(`   ✓ ${file}: ${data.length} associations`);
    } catch (error) {
      console.log(`   ❌ ${file}: ${error.message}`);
    }
  });

  // Write CSV
  console.log('\n3. Writing combined CSV...');
  const csvContent = [
    headers.join(','),
    ...allRows
  ].join('\n');

  fs.writeFileSync(OUTPUT_FILE, csvContent, 'utf8');

  console.log();
  console.log('╔════════════════════════════════════════╗');
  console.log('║         COMBINATION COMPLETE!          ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n✓ Total rows: ${allRows.length}`);
  console.log(`✓ Output: ${OUTPUT_FILE}\n`);
}

combineItalyFiles();
