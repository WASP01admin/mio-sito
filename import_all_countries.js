#!/usr/bin/env node

/**
 * BULK IMPORT ALL COUNTRIES
 * Imports CSV files for Canada, UK, Australia, New Zealand, Ireland, USA
 * Each country gets unique codes: CA####, UK####, AU####, NZ####, IE####, US####
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BATCH_SIZE = 50;

// Country configuration
const COUNTRIES = [
  { code: 'CA', name: 'Canada', file: 'C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\CANADA .csv' },
  { code: 'UK', name: 'United Kingdom', file: 'C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\UK.csv' },
  { code: 'AU', name: 'Australia', file: 'C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\AUSTRALIA.csv' },
  { code: 'NZ', name: 'New Zealand', file: 'C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\NEW ZEL.csv' },
  { code: 'IE', name: 'Ireland', file: 'C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\IRELAND.csv' },
  { code: 'US', name: 'United States', file: 'C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\USA.csv' }
];

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function importCountry(countryConfig) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`IMPORTING ${countryConfig.name.toUpperCase()} (${countryConfig.code})`);
  console.log(`${'='.repeat(60)}`);

  // Check if file exists
  if (!fs.existsSync(countryConfig.file)) {
    console.log(`⚠️  File not found: ${countryConfig.file}`);
    return { country: countryConfig.name, total: 0, imported: 0, failed: 0 };
  }

  // Read CSV
  console.log('1. Reading CSV file...');
  const fileStream = fs.createReadStream(countryConfig.file);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const records = [];
  let headerRow = null;
  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;

    // Skip empty lines and country markers
    if (!line.trim() || line.trim().toUpperCase().includes('START')) continue;

    // Parse header (first data line)
    if (!headerRow) {
      headerRow = parseCSVLine(line);
      continue;
    }

    // Parse data row
    const values = parseCSVLine(line);
    const row = {};
    headerRow.forEach((header, idx) => {
      row[header?.trim()] = values[idx]?.trim() || '';
    });

    // Get name field (could be NAME, NOME ASSOCIAZIONE, etc.)
    const name = row['NAME'] || row['NOME ASSOCIAZIONE'] || '';
    if (name) {
      records.push(row);
    }
  }

  console.log(`   ✓ Parsed ${records.length} associations\n`);

  if (records.length === 0) {
    return { country: countryConfig.name, total: 0, imported: 0, failed: 0 };
  }

  // Prepare records for insertion
  console.log('2. Preparing records...');
  const toInsert = records.map((row, idx) => {
    const lat = row['LAT']?.trim();
    const lon = row['LON']?.trim();

    // Try multiple possible column names
    const name = row['NAME'] || row['NOME ASSOCIAZIONE'] || '';
    const address = row['ADDRESS'] || row['INDIRIZZO'] || '';
    const email = row['EMAIL'] || '';
    const website = row['WEBSITE'] || row['SITO WEB'] || '';
    const phone = row['PHONE'] || row['TELEFONO'] || '';
    const facebook = row['FACEBOOK'] || '';
    const instagram = row['INSTAGRAM'] || '';

    // Extract city from address if possible
    let city = '';
    if (address) {
      const parts = address.split(',');
      if (parts.length > 0) {
        const lastPart = parts[parts.length - 1].trim();
        const match = lastPart.match(/^\d+\s+(.+)/);
        city = match ? match[1] : lastPart;
      }
    }

    return {
      code: `${countryConfig.code}${String(idx + 1).padStart(4, '0')}`,
      name: name || 'Unknown',
      email: email || null,
      address: address || null,
      website: website || null,
      phone: phone || null,
      facebook_url: facebook || null,
      lat: lat && !isNaN(parseFloat(lat)) ? parseFloat(lat) : null,
      lng: lon && !isNaN(parseFloat(lon)) ? parseFloat(lon) : null,
      city: city || countryConfig.name,
      country: countryConfig.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  console.log(`   ✓ Generated codes (${countryConfig.code}0001-${countryConfig.code}${String(toInsert.length).padStart(4, '0')})\n`);

  // Count coordinates
  const withCoords = toInsert.filter(r => r.lat && r.lng).length;
  console.log(`   ℹ️  Records with coordinates: ${withCoords}/${toInsert.length}\n`);

  // Insert in batches
  console.log('3. Inserting into Supabase...');
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('associations')
      .insert(batch);

    if (error) {
      console.log(`   ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`);
      failed += batch.length;
    } else {
      inserted += batch.length;
      const percent = Math.round((inserted / toInsert.length) * 100);
      process.stdout.write(
        `\r   Progress: ${inserted}/${toInsert.length} (${percent}%) | Failed: ${failed}`
      );
    }
  }

  console.log('\n');
  return {
    country: countryConfig.name,
    total: toInsert.length,
    imported: inserted,
    failed: failed
  };
}

async function importAllCountries() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   BULK IMPORT: ALL COUNTRIES           ║');
  console.log('╚════════════════════════════════════════╝\n');

  const results = [];

  for (const country of COUNTRIES) {
    const result = await importCountry(country);
    results.push(result);
  }

  // Summary
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         IMPORT COMPLETE!               ║');
  console.log('╚════════════════════════════════════════╝\n');

  const totalRecs = results.reduce((sum, r) => sum + r.total, 0);
  const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

  console.log('Summary by Country:');
  results.forEach(r => {
    if (r.total > 0) {
      const pct = Math.round((r.imported / r.total) * 100);
      console.log(`  ${r.country.padEnd(20)} ${r.imported}/${r.total} (${pct}%)`);
    }
  });

  console.log(`\n  ${'TOTAL'.padEnd(20)} ${totalImported}/${totalRecs}`);
  console.log(`\n✓ All countries imported!\n`);
}

importAllCountries().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
