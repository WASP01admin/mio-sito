#!/usr/bin/env node

/**
 * PHASE 5: US ADDRESS GEOCODING
 * Geocode the 1,000 US records with suggested_address + suggested_city
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CSV_FILE = process.platform === 'win32'
  ? 'C:\\Users\\robbu\\Desktop\\Associations LISTS\\us_records_for_research.csv'
  : '/c/Users/robbu/Desktop/Associations LISTS/us_records_for_research.csv';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeAddress(address, city, state = 'USA', country = 'USA') {
  if (!address && !city) return null;

  const parts = [address, city, state, country].filter(x => x && x.trim());
  const query = parts.join(', ');

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'WASP-US-Geocoder/2.0',
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

async function phase5() {
  console.log('========================================');
  console.log('PHASE 5: US ADDRESS GEOCODING (1,000)');
  console.log('========================================');
  console.log();

  // Read CSV
  console.log('1. Reading US research records...');

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

  console.log(`   ✓ Read ${records.length} records\n`);

  // Filter to records with suggested addresses
  console.log('2. Filtering records with suggested addresses...');
  const withAddress = records.filter(
    r => (r.suggested_address || r.suggested_city) && r.id && r.name
  );

  console.log(`   ✓ Records with address data: ${withAddress.length}`);
  console.log(`   ⚠ Records without address: ${records.length - withAddress.length}\n`);

  if (withAddress.length === 0) {
    console.log('⚠️ No records with address data found.');
    process.exit(0);
  }

  // Geocode
  console.log('3. Geocoding addresses (1 per second)...');
  let success = 0;
  let failed = 0;
  const toUpdate = [];
  const startTime = Date.now();

  for (let i = 0; i < withAddress.length; i++) {
    if (i % 50 === 0) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const rate = i > 0 ? i / (elapsed / 60) : 0;
      const remaining = i > 0 ? Math.ceil((withAddress.length - i) / rate) : 0;
      const percent = Math.round((i / withAddress.length) * 100);
      process.stdout.write(
        `\r   [${percent}%] ${i}/${withAddress.length} | Success: ${success} | Failed: ${failed} | ETA: ${remaining}m`
      );
    }

    const rec = withAddress[i];
    const coords = await geocodeAddress(
      rec.suggested_address,
      rec.suggested_city,
      rec.suggested_state || 'USA',
      'USA'
    );

    if (coords) {
      toUpdate.push({
        id: rec.id,
        name: rec.name,
        lat: coords.lat,
        lng: coords.lng,
      });
      success++;
    } else {
      failed++;
    }

    // Rate limit
    if (i < withAddress.length - 1) {
      await sleep(1000);
    }
  }

  console.log(`\n   ✓ Successfully geocoded: ${success}`);
  console.log(`   ✗ Failed: ${failed}\n`);

  // Update Supabase
  console.log('4. Updating Supabase with coordinates...');

  let updatedCount = 0;
  for (let i = 0; i < toUpdate.length; i++) {
    const update = toUpdate[i];

    const { error: updateError } = await supabase
      .from('associations')
      .update({ lat: update.lat, lng: update.lng })
      .eq('id', update.id);

    if (!updateError) {
      updatedCount++;
    }

    if ((i + 1) % 50 === 0 || i === toUpdate.length - 1) {
      const percent = Math.round(((i + 1) / toUpdate.length) * 100);
      console.log(`   ✓ Updated: ${i + 1}/${toUpdate.length} (${percent}%)`);
    }
  }

  console.log();
  console.log('========================================');
  console.log('PHASE 5 COMPLETE!');
  console.log('========================================');
  console.log(`✓ Records with address data: ${withAddress.length}`);
  console.log(`✓ Successfully geocoded: ${success}`);
  console.log(`✓ Successfully updated DB: ${updatedCount}`);
  console.log(`✗ Failed to geocode: ${failed}`);
  console.log();
  console.log('📍 US associations are now on the map!');
}

phase5().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
