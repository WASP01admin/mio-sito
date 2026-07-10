#!/usr/bin/env node

/**
 * IMPORT CLEANED ITALIAN ASSOCIATIONS (963 records)
 * From user's cleaned CSV: TOTALE ASS ITALIANE 963 - ITA COMPLETE LIST(1).csv
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_FILE = 'C:\\Users\\robbu\\Downloads\\TOTALE ASS ITALIANE 963 - ITA COMPLETE LIST(1).csv';
const BATCH_SIZE = 50;

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

async function importItalyAssociations() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  IMPORTING ITALIAN ASSOCIATIONS (963)  ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Read CSV
  console.log('1. Reading CSV file...');
  const fileStream = fs.createReadStream(CSV_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const records = [];
  let headerRow = null;
  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;

    // Skip empty lines
    if (!line.trim()) continue;

    // Parse header
    if (!headerRow) {
      headerRow = parseCSVLine(line);
      console.log(`   Headers: ${headerRow.join(' | ')}\n`);
      continue;
    }

    // Parse data row
    const values = parseCSVLine(line);
    const row = {};
    headerRow.forEach((header, idx) => {
      row[header] = values[idx]?.trim() || '';
    });

    // Only include rows with a name
    if (row['NOME ASSOCIAZIONE']?.trim()) {
      records.push(row);
    }
  }

  console.log(`   ✓ Parsed ${records.length} associations from ${lineCount} lines\n`);

  if (records.length === 0) {
    console.log('❌ No valid records found!');
    process.exit(1);
  }

  // Generate codes for records without them
  console.log('2. Preparing records...');
  const toInsert = records.map((row, idx) => {
    const lat = row['LAT']?.trim();
    const lon = row['LON']?.trim();
    const address = row['INDIRIZZO']?.trim() || '';

    // Extract city from address (last part after comma, or from postal code)
    let city = '';
    if (address) {
      const parts = address.split(',');
      if (parts.length > 0) {
        const lastPart = parts[parts.length - 1].trim();
        // Check if it looks like a postal code + city
        const match = lastPart.match(/^\d+\s+(.+)/);
        city = match ? match[1] : lastPart;
      }
    }

    return {
      code: `ITA${String(idx + 1).padStart(4, '0')}`,
      name: row['NOME ASSOCIAZIONE']?.trim() || '',
      email: row['EMAIL']?.trim() || null,
      address: address || null,
      website: row['SITO WEB']?.trim() || null,
      phone: row['TELEFONO']?.trim() || null,
      facebook_url: row['FACEBOOK']?.trim() || null,
      lat: lat && !isNaN(parseFloat(lat)) ? parseFloat(lat) : null,
      lng: lon && !isNaN(parseFloat(lon)) ? parseFloat(lon) : null,
      city: city || 'Italy',
      country: 'Italy',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  console.log(`   ✓ Generated codes (ITA0001-ITA${String(toInsert.length).padStart(4, '0')})\n`);

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
      console.log(`\n   ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`);
      failed += batch.length;
    } else {
      inserted += batch.length;
      const percent = Math.round((inserted / toInsert.length) * 100);
      process.stdout.write(
        `\r   Progress: ${inserted}/${toInsert.length} (${percent}%) | Failed: ${failed}`
      );
    }
  }

  console.log('\n\n╔════════════════════════════════════════╗');
  console.log('║         IMPORT COMPLETE!               ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✓ Successfully imported: ${inserted}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`✓ Records with coordinates: ${withCoords}`);
  console.log(`\n🇮🇹 Italian associations ready!\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

importItalyAssociations().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
