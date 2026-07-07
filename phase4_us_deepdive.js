#!/usr/bin/env node

/**
 * PHASE 4: US +1 DEEP DIVE
 * Research 659 problematic US records for addresses
 * Strategy: Try website → org name extraction → email domain hints
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CSV_FILE = process.platform === 'win32'
  ? 'C:\\Users\\robbu\\Desktop\\Associations LISTS\\problematic_us_plus1_records.csv'
  : '/c/Users/robbu/Desktop/Associations LISTS/problematic_us_plus1_records.csv';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractCityFromName(name) {
  // Try to find city in parentheses: "Org Name (City, State)" or "Org Name (City)"
  const match = name.match(/\(([^,)]+)(?:,\s*\w{2})?\)/);
  return match ? match[1].trim() : null;
}

function extractStateFromName(name) {
  // Try to find state: "Org Name (City, State)"
  const match = name.match(/\(\w+,\s*(\w{2})\)/);
  return match ? match[1].trim() : null;
}

async function geocodeAddress(address, city, state, country = 'USA') {
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
          'User-Agent': 'WASP-US-Deep-Dive/1.0',
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

async function phase4() {
  console.log('========================================');
  console.log('PHASE 4: US +1 DEEP DIVE (659 RECORDS)');
  console.log('========================================');
  console.log();

  // Read CSV
  console.log('1. Reading problematic US records...');

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

  console.log(`   ✓ Read ${records.length} problematic US records\n`);

  // Extract cities from org names
  console.log('2. Extracting cities from organization names...');
  let withCity = 0;
  let withoutCity = 0;

  const researched = [];

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const city = extractCityFromName(rec.name || '');
    const state = extractStateFromName(rec.name || '');

    if (city) {
      withCity++;
      researched.push({
        id: null, // Will fetch from DB
        name: rec.name,
        city: city,
        state: state || 'US',
        address: '',
        country: 'USA',
      });
    } else {
      withoutCity++;
    }
  }

  console.log(`   ✓ Found cities in names: ${withCity}`);
  console.log(`   ⚠ No city found: ${withoutCity}\n`);

  if (researched.length === 0) {
    console.log('⚠️ No records with extractable city data.');
    process.exit(0);
  }

  // Geocode the extracted cities
  console.log('3. Geocoding extracted cities...');
  let geocodeSuccess = 0;
  let geocodeFailed = 0;
  const toUpdate = [];

  for (let i = 0; i < researched.length; i++) {
    if (i % 25 === 0) {
      const percent = Math.round((i / researched.length) * 100);
      process.stdout.write(`\r   [${percent}%] ${i}/${researched.length}`);
    }

    const rec = researched[i];
    const coords = await geocodeAddress('', rec.city, rec.state, rec.country);

    if (coords) {
      toUpdate.push({
        name: rec.name,
        lat: coords.lat,
        lng: coords.lng,
      });
      geocodeSuccess++;
    } else {
      geocodeFailed++;
    }

    // Rate limit
    await sleep(1000);
  }

  console.log(`\n   ✓ Successfully geocoded: ${geocodeSuccess}`);
  console.log(`   ✗ Failed: ${geocodeFailed}\n`);

  // Fetch IDs and update Supabase
  if (toUpdate.length > 0) {
    console.log('4. Fetching record IDs and updating database...');

    let updatedCount = 0;

    for (let i = 0; i < toUpdate.length; i++) {
      const update = toUpdate[i];

      // Find the record by name
      const { data: existing } = await supabase
        .from('associations')
        .select('id')
        .eq('name', update.name)
        .limit(1);

      if (existing && existing.length > 0) {
        const { error: updateError } = await supabase
          .from('associations')
          .update({ lat: update.lat, lng: update.lng })
          .eq('id', existing[0].id);

        if (!updateError) {
          updatedCount++;
        }
      }

      if ((i + 1) % 50 === 0) {
        const percent = Math.round(((i + 1) / toUpdate.length) * 100);
        console.log(`   ✓ Updated: ${i + 1}/${toUpdate.length} (${percent}%)`);
      }
    }

    console.log(`   ✓ Final count: ${updatedCount}/${toUpdate.length}`);
  }

  console.log();
  console.log('========================================');
  console.log('PHASE 4 COMPLETE!');
  console.log('========================================');
  console.log(`✓ Records with extractable cities: ${withCity}`);
  console.log(`✓ Successfully geocoded: ${geocodeSuccess}`);
  console.log(`✗ Failed to geocode: ${geocodeFailed}`);
  console.log();
  console.log('🏆 TREASURE HUNT COMPLETE! All phases finished!');
}

phase4().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
