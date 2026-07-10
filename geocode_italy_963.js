#!/usr/bin/env node

/**
 * GEOCODE ITALIAN ASSOCIATIONS (955 records)
 * Using address + city + country via Nominatim
 * Rate limited: 1 request/sec
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
          'User-Agent': 'WASP-Italy-Geocode/1.0',
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

async function geocodeItalyAssociations() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   GEOCODING ITALIAN ASSOCIATIONS       ║');
  console.log('║   (955 records, ~16 minutes)           ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Fetch all Italian records without coordinates
  console.log('1. Fetching Italian associations...');
  const { data: records } = await supabase
    .from('associations')
    .select('id, code, name, address, city, country')
    .eq('country', 'Italy')
    .is('lat', null);

  console.log(`   ✓ Found ${records?.length} records to geocode\n`);

  if (!records || records.length === 0) {
    console.log('✓ All Italian records already have coordinates!');
    process.exit(0);
  }

  // Geocode each record
  console.log('2. Geocoding...');
  console.log(`   ETA: ~${Math.ceil(records.length / 60)} minutes\n`);

  let success = 0;
  let failed = 0;
  const updates = [];
  const startTime = Date.now();

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    if (i % 50 === 0 && i > 0) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const rate = i > 0 ? i / (elapsed / 60) : 0;
      const remaining = i > 0 ? Math.ceil((records.length - i) / rate) : 0;
      const percent = Math.round((i / records.length) * 100);
      process.stdout.write(
        `\r   [${percent}%] ${i}/${records.length} | Success: ${success} | Failed: ${failed} | ETA: ${remaining}m`
      );
    }

    const coords = await geocode(record.address, record.city, record.country);

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

    // Rate limit: 1 request/sec
    if (i < records.length - 1) {
      await sleep(1000);
    }
  }

  console.log(`\n   Complete!\n`);

  // Update Supabase
  console.log('3. Updating Supabase...');

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

    const displayCount = Math.min(i + 50, updates.length);
    const percent = Math.round((displayCount / updates.length) * 100);
    process.stdout.write(
      `\r   Updated: ${displayCount}/${updates.length} (${percent}%)`
    );
  }

  console.log('\n\n╔════════════════════════════════════════╗');
  console.log('║      GEOCODING COMPLETE!               ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✓ Successfully geocoded: ${updatedCount}`);
  console.log(`✗ Failed to geocode: ${failed}`);
  console.log(`✓ Success rate: ${Math.round((success / records.length) * 100)}%`);
  console.log(`\n🗺️  Italian associations are now on the map!\n`);
}

geocodeItalyAssociations().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
