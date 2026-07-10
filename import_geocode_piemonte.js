#!/usr/bin/env node

/**
 * IMPORT + GEOCODE PIEMONTE ASSOCIATIONS
 * Import 293 PIEMONTE associations and geocode all addresses
 */

const fs = require('fs');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PIEMONTE_FILE = 'C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\ITA - PIEMONTE.csv';
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocode(address, city, country) {
  if (!address || !city) return null;

  const query = `${address}, ${city}, ${country}`;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'WASP-Piemonte-Geocode/1.0',
        },
      }
    );

    if (!response.ok) return null;
    const results = await response.json();
    if (results.length === 0) return null;

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
    };
  } catch (error) {
    return null;
  }
}

async function importAndGeocodePiemonte() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  IMPORT + GEOCODE PIEMONTE (293)       ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Read PIEMONTE CSV
  console.log('1. Reading PIEMONTE CSV...');
  const fileStream = fs.createReadStream(PIEMONTE_FILE);
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

    const name = row['NOME ASSOCIAZIONE'] || '';
    if (name) {
      records.push(row);
    }
  }

  console.log(`   ✓ Parsed ${records.length} associations\n`);

  // Get current max ITA code
  console.log('2. Getting max existing ITA code...');
  const { data: maxCode } = await supabase
    .from('associations')
    .select('code')
    .eq('country', 'Italy')
    .order('code', { ascending: false })
    .limit(1);

  let startNum = 956; // Default: 955 existing + 1
  if (maxCode && maxCode.length > 0) {
    const lastCode = maxCode[0].code;
    const lastNum = parseInt(lastCode.substring(3));
    startNum = lastNum + 1;
  }
  console.log(`   ✓ Starting from ITA${String(startNum).padStart(4, '0')}\n`);

  // Prepare records
  console.log('3. Preparing and geocoding records...');
  console.log(`   ETA: ~${Math.ceil(records.length / 60)} minutes\n`);

  const toInsert = [];
  let success = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < records.length; i++) {
    const row = records[i];

    // Extract city from CITTÀ column or address
    let city = row['CITTÀ'] || '';
    const address = row['INDIRIZZO'] || '';

    if (!city && address) {
      const parts = address.split(',');
      if (parts.length > 0) {
        const lastPart = parts[parts.length - 1].trim();
        const match = lastPart.match(/^\d+\s+(.+)/);
        city = match ? match[1] : lastPart;
      }
    }

    // Geocode the address
    const coords = await geocode(address, city, 'Italy');

    if (coords) {
      success++;
    } else {
      failed++;
    }

    toInsert.push({
      code: `ITA${String(startNum + i).padStart(4, '0')}`,
      name: row['NOME ASSOCIAZIONE'] || 'Unknown',
      email: row['EMAIL'] || null,
      address: address || null,
      website: row['SITO WEB'] || null,
      phone: row['TELEFONO'] || null,
      facebook_url: row['FACEBOOK'] || null,
      lat: coords?.lat || null,
      lng: coords?.lng || null,
      city: city || 'Piemonte',
      country: 'Italy',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Progress
    if ((i + 1) % 50 === 0) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const rate = (i + 1) / (elapsed / 60);
      const remaining = Math.ceil((records.length - i - 1) / rate);
      const percent = Math.round(((i + 1) / records.length) * 100);
      process.stdout.write(
        `\r   [${percent}%] ${i + 1}/${records.length} | Geocoded: ${success} | Failed: ${failed} | ETA: ${remaining}m`
      );
    }

    // Rate limit: 1 request/sec
    if (i < records.length - 1) {
      await sleep(1000);
    }
  }

  console.log(`\n   ✓ Geocoding complete!\n`);

  // Insert into database
  console.log('4. Inserting into Supabase...');
  let inserted = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('associations')
      .insert(batch);

    if (error) {
      console.log(`   ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`);
    } else {
      inserted += batch.length;
      const percent = Math.round((inserted / toInsert.length) * 100);
      process.stdout.write(`\r   Progress: ${inserted}/${toInsert.length} (${percent}%)`);
    }
  }

  console.log('\n\n╔════════════════════════════════════════╗');
  console.log('║         IMPORT COMPLETE!               ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✓ Imported: ${inserted}/${toInsert.length}`);
  console.log(`✓ Geocoded: ${success}/${records.length} (${Math.round((success / records.length) * 100)}%)`);
  console.log(`✗ Failed to geocode: ${failed}`);
  console.log(`\n🗺️  PIEMONTE associations are now on the map!\n`);
}

importAndGeocodePiemonte().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
