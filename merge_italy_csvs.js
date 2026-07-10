#!/usr/bin/env node

/**
 * MERGE ITALY CSVs - Unify ITA.csv and ITA - PIEMONTE.csv
 * Maps both to the standardized 14-column format
 */

const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

function readCSV(filePath) {
  console.log(`\nReading: ${path.basename(filePath)}`);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());

  let headers = parseCSVLine(lines[0]);
  // Normalize headers: trim and filter empty ones
  headers = headers.map(h => h.trim()).filter(h => h);

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record = {};
    headers.forEach((header, idx) => {
      if (header) {
        record[header] = values[idx] || '';
      }
    });
    records.push(record);
  }

  console.log(`  ✓ Found ${records.length} records`);
  return records;
}

function mergeAndStandardize() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  MERGE ITALY CSVs → 14-COLUMN STANDARD    ║');
  console.log('╚═══════════════════════════════════════════╝');

  // Read both files
  const itaRecords = readCSV('C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\ITA.csv');
  const piemonteRecords = readCSV('C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\ITA - PIEMONTE.csv');

  // Merge
  const allRecords = [...itaRecords, ...piemonteRecords];
  console.log(`\n✓ Merged: ${allRecords.length} total records`);

  // Map to standardized 14 columns
  console.log('\nMapping to 14-column standard...');
  const standardized = allRecords.map((record, idx) => {
    return {
      name: record['NOME ASSOCIAZIONE'] || '',
      address: record['INDIRIZZO'] || '',
      city: record['CITTÀ'] || '',
      postal_code: '',
      email: record['EMAIL'] || '',
      email_secondary: '',
      phone: record['TELEFONO'] || '',
      website: record['SITO WEB'] || '',
      lat: record['LAT'] || '',
      lng: record['LON'] || '',
      facebook_url: record['FACEBOOK'] || '',
      instagram: record['INSTAGRAM'] || '',
      contact_person: '',
      extra_details: [record['EXTRA 1'] || '', record['EXTRA 2'] || ''].filter(x => x).join(' | ')
    };
  });

  // Export to standardized CSV
  const outputPath = 'C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\ITALY_UNIFIED.csv';
  const headers = ['name', 'address', 'city', 'postal_code', 'email', 'email_secondary', 'phone', 'website', 'lat', 'lng', 'facebook_url', 'instagram', 'contact_person', 'extra_details'];

  const csvLines = [headers.join(',')];
  standardized.forEach(row => {
    const values = headers.map(h => {
      const val = row[h];
      if (!val) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvLines.push(values.join(','));
  });

  fs.writeFileSync(outputPath, csvLines.join('\n'));
  console.log(`✓ Created unified Italy CSV: ${outputPath}`);

  // Summary
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  MERGE COMPLETE                          ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  console.log(`Total records: ${standardized.length}`);
  console.log(`Records with name: ${standardized.filter(r => r.name).length}`);
  console.log(`Records with coordinates: ${standardized.filter(r => r.lat && r.lng).length}`);
  console.log(`Records with email: ${standardized.filter(r => r.email).length}`);
  console.log(`Records with city: ${standardized.filter(r => r.city).length}`);
}

mergeAndStandardize();
