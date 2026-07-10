#!/usr/bin/env node

/**
 * GEOCODE the 454 found addresses
 * Uses Nominatim to convert city/state into LAT/LNG
 * Rate limited to 1 request/sec (Nominatim requirement)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CSV_FILE = `${process.env.USERPROFILE}\\Desktop\\research_all_1000_results.csv`;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Geocode address using Nominatim
async function geocodeAddress(city, state) {
  if (!city && !state) return null;

  const query = [city, state, 'USA'].filter(x => x && x.trim()).join(', ');

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'WASP-Address-Geocoder/1.0',
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

async function geocodeFound() {
  console.log('========================================');
  console.log('GEOCODING 454 FOUND ADDRESSES');
  console.log('========================================');
  console.log();

  // Read CSV
  console.log('1. Reading research results...');
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`ERROR: File not found: ${CSV_FILE}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  // Filter to only records with found data
  const toGeocode = records.filter(
    r => (r.city && r.city.trim()) || (r.state && r.state.trim())
  );

  console.log(`   Total records: ${records.length}`);
  console.log(`   With addresses found: ${toGeocode.length}`);
  console.log();

  if (toGeocode.length === 0) {
    console.log('✓ No records to geocode!');
    process.exit(0);
  }

  // Geocode each
  console.log('2. Geocoding addresses (1 per second)...');
  let success = 0;
  let failed = 0;
  const updates = [];

  for (let i = 0; i < toGeocode.length; i++) {
    const record = toGeocode[i];

    process.stdout.write(
      `\r   Progress: ${i + 1}/${toGeocode.length} (${success} geocoded, ${failed} failed)`
    );

    const coords = await geocodeAddress(record.city, record.state);

    if (coords) {
      updates.push({
        id: record.id,
        lat: coords.lat,
        lng: coords.lng,
      });
      success++;
    } else {
      failed++;
    }

    // Rate limit: 1 second between requests
    if (i < toGeocode.length - 1) {
      await sleep(1000);
    }
  }

  console.log(`\n   Complete!\n`);

  // Update Supabase
  console.log('3. Updating Supabase with coordinates...');

  let updatedCount = 0;
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50);

    for (const update of batch) {
      const { error: updateError } = await supabase
        .from('associations')
        .update({ lat: update.lat, lng: update.lng })
        .eq('id', update.id);

      if (!updateError) {
        updatedCount++;
      }
    }

    const progress = Math.min(updatedCount, updates.length);
    console.log(`   Updated: ${progress}/${updates.length}`);
  }

  console.log();
  console.log('========================================');
  console.log('GEOCODING COMPLETE!');
  console.log('========================================');
  console.log(`✓ Successfully geocoded: ${updatedCount} addresses`);
  console.log(`✗ Failed to geocode: ${failed} addresses`);
  console.log();
  console.log('Your map is now MUCH more complete!');
  console.log('Refresh to see the new coordinates! 🗺️');
}

geocodeFound().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
