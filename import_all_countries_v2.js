#!/usr/bin/env node

/**
 * BULK IMPORT ALL COUNTRIES - V2 (with better error handling)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BATCH_SIZE = 25; // Smaller batches for reliability

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

  if (!fs.existsSync(countryConfig.file)) {
    console.log(`⚠️  File not found: ${countryConfig.file}`);
    return { country: countryConfig.name, total: 0, imported: 0, failed: 0 };
  }

  console.log('1. Reading CSV file...');
  const fileStream = fs.createReadStream(countryConfig.file);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const records = [];
  let headerRow = null;

  for await (const line of rl) {
    if (!line.trim() || line.trim().toUpperCase().includes('START')) continue;

    if (!headerRow) {
      headerRow = parseCSVLine(line);
      continue;
    }

    const values = parseCSVLine(line);
    const row = {};
    headerRow.forEach((header, idx) => {
      row[header?.trim()] = values[idx]?.trim() || '';
    });

    const name = row['NAME'] || row['NOME ASSOCIAZIONE'] || '';
    if (name) {
      records.push(row);
    }
  }

  console.log(`   ✓ Parsed ${records.length} associations\n`);

  if (records.length === 0) {
    return { country: countryConfig.name, total: 0, imported: 0, failed: 0 };
  }

  console.log('2. Preparing records...');
  const toInsert = records.map((row, idx) => {
    const lat = row['LAT']?.trim();
    const lon = row['LON']?.trim();
    const name = row['NAME'] || row['NOME ASSOCIAZIONE'] || '';
    const address = row['ADDRESS'] || row['INDIRIZZO'] || '';
    const email = row['EMAIL'] || '';
    const website = row['WEBSITE'] || row['SITO WEB'] || '';
    const phone = row['PHONE'] || row['TELEFONO'] || '';
    const facebook = row['FACEBOOK'] || '';

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

  console.log(`   ✓ Generated codes\n`);

  const withCoords = toInsert.filter(r => r.lat && r.lng).length;
  console.log(`   ℹ️  Records with coordinates: ${withCoords}/${toInsert.length}\n`);

  console.log('3. Inserting into Supabase...');
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);

    try {
      const { error } = await supabase
        .from('associations')
        .insert(batch);

      if (error) {
        console.log(`   ❌ Batch at ${i}: ${error.message}`);
        failed += batch.length;
      } else {
        inserted += batch.length;
      }
    } catch (e) {
      console.log(`   ❌ Batch at ${i}: ${e.message}`);
      failed += batch.length;
    }

    if ((i + BATCH_SIZE) % 250 === 0 || i + BATCH_SIZE >= toInsert.length) {
      const percent = Math.round(((i + BATCH_SIZE) / toInsert.length) * 100);
      console.log(`   Progress: ${Math.min(i + BATCH_SIZE, toInsert.length)}/${toInsert.length} (${percent}%)`);
    }
  }

  console.log();
  return {
    country: countryConfig.name,
    total: toInsert.length,
    imported: inserted,
    failed: failed
  };
}

async function importAllCountries() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   BULK IMPORT: ALL COUNTRIES (V2)      ║');
  console.log('╚════════════════════════════════════════╝\n');

  const results = [];

  for (const country of COUNTRIES) {
    const result = await importCountry(country);
    results.push(result);
  }

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
  if (totalFailed > 0) {
    console.log(`  Failed: ${totalFailed}`);
  }
  console.log();
}

importAllCountries().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
