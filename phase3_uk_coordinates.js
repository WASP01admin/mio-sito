#!/usr/bin/env node

/**
 * PHASE 3: Process 249 UK coordinates
 * Strategy: Reverse-geocode LAT/LNG → address, then match to existing orgs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CSV_FILE = process.platform === 'win32'
  ? 'C:\\Users\\robbu\\Desktop\\Associations LISTS\\holding_coordinates_for_review.csv'
  : '/c/Users/robbu/Desktop/Associations LISTS/holding_coordinates_for_review.csv';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'WASP-Reverse-Geocoder/1.0',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      address: data.address?.road || data.address?.village || data.address?.town || '',
      city: data.address?.city || data.address?.town || data.address?.county || '',
      country: data.address?.country || 'UK',
    };
  } catch (error) {
    return null;
  }
}

async function processUKCoordinates() {
  console.log('========================================');
  console.log('PHASE 3: PROCESSING 249 UK COORDINATES');
  console.log('========================================');
  console.log();

  // Read CSV
  console.log('1. Reading UK coordinates file...');

  const records = [];
  let headerRow = true;
  let headers = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(CSV_FILE),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (headerRow) {
      headers = line.split(',');
      headerRow = false;
      continue;
    }

    const values = line.split(',');
    const record = {};
    headers.forEach((h, i) => {
      record[h.trim()] = (values[i] || '').trim();
    });

    records.push(record);
  }

  console.log(`   ✓ Read ${records.length} coordinate pairs\n`);

  // Reverse geocode
  console.log('2. Reverse-geocoding coordinates...');
  const geocoded = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i++) {
    if (i % 25 === 0) {
      const percent = Math.round((i / records.length) * 100);
      process.stdout.write(`\r   [${percent}%] ${i}/${records.length}`);
    }

    const lat = parseFloat(records[i].lat);
    const lng = parseFloat(records[i].lon || records[i].lng);

    if (isNaN(lat) || isNaN(lng)) {
      failed++;
      continue;
    }

    const geo = await reverseGeocode(lat, lng);

    if (geo) {
      geocoded.push({
        lat: lat,
        lng: lng,
        address: geo.address,
        city: geo.city,
        country: geo.country,
      });
      success++;
    } else {
      failed++;
    }

    // Rate limit: 1 request/sec
    if (i < records.length - 1) {
      await sleep(1000);
    }
  }

  console.log(`\n   ✓ Successfully reverse-geocoded: ${success}`);
  console.log(`   ✗ Failed: ${failed}\n`);

  // Try to match to existing orgs
  console.log('3. Attempting to match to existing organizations...');

  const { data: existingOrgs } = await supabase
    .from('associations')
    .select('id, name, lat, lng, city, country')
    .not('lat', 'is', null)
    .limit(10000);

  let matched = 0;
  let unmatched = 0;
  const toImport = [];

  for (const geo of geocoded) {
    let found = false;

    // Check if there's an org within 1km of this coordinate
    for (const org of existingOrgs || []) {
      const dist = Math.sqrt(
        Math.pow(geo.lat - org.lat, 2) + Math.pow(geo.lng - org.lng, 2)
      );

      if (dist < 0.01) { // ~1km
        found = true;
        matched++;
        break;
      }
    }

    if (!found) {
      unmatched++;
      toImport.push({
        code: `UK${String(unmatched).padStart(4, '0')}`,
        name: `UK Organization - ${geo.city}`,
        city: geo.city,
        country: 'UK',
        address: geo.address,
        lat: geo.lat,
        lng: geo.lng,
      });
    }
  }

  console.log(`   ✓ Matched to existing: ${matched}`);
  console.log(`   ⚠ New organizations to import: ${unmatched}\n`);

  // Import new organizations
  if (toImport.length > 0) {
    console.log('4. Importing new UK organizations...');

    const BATCH_SIZE = 50;
    let importedCount = 0;

    for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
      const batch = toImport.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('associations').insert(batch);

      if (!error) {
        importedCount += batch.length;
        const percent = Math.round((importedCount / toImport.length) * 100);
        console.log(`   ✓ Imported: ${importedCount}/${toImport.length} (${percent}%)`);
      }
    }
  }

  console.log();
  console.log('========================================');
  console.log('PHASE 3 COMPLETE!');
  console.log('========================================');
  console.log(`✓ UK coordinates processed: ${geocoded.length}`);
  console.log(`✓ Matched to existing: ${matched}`);
  console.log(`✓ New UK organizations imported: ${toImport.length}`);
  console.log();
  console.log('🎯 Ready for Phase 4: US +1 Deep Dive!');
}

processUKCoordinates().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
