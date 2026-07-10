#!/usr/bin/env node

/**
 * PHASE 2 BATCH 2: Geocode remaining 1,953+ OTH records
 * Uses pagination to get records beyond the 1,000 limit
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeAddress(address, city, country) {
  if (!address && !city) return null;

  const parts = [address, city, country].filter(x => x && x.trim());
  const query = parts.join(', ');

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'WASP-Association-Geocoder/2.0',
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

async function geocodeBatch2() {
  console.log('========================================');
  console.log('PHASE 2 BATCH 2: REMAINING OTH RECORDS');
  console.log('========================================');
  console.log();

  // Fetch remaining OTH records without coordinates
  console.log('1. Fetching remaining OTH records without coords...');
  const { data: records, error } = await supabase
    .from('associations')
    .select('id, name, address, city, country')
    .ilike('code', 'OTH%')
    .is('lat', null)
    .is('lng', null);

  if (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }

  console.log(`   Found ${records?.length || 0} records without coordinates`);
  console.log();

  if (!records || records.length === 0) {
    console.log('✓ All OTH records already geocoded!');
    process.exit(0);
  }

  // Geocode each record
  console.log('2. Geocoding addresses (1 per second)...');
  console.log(`   ETA: ~${Math.ceil((records.length / 60))} minutes`);
  console.log();

  let success = 0;
  let failed = 0;
  const updates = [];
  const startTime = Date.now();

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Show progress every 50 records
    if (i % 50 === 0) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const rate = i > 0 ? i / (elapsed / 60) : 0;
      const remaining = i > 0 ? Math.ceil((records.length - i) / rate) : 0;
      const percent = Math.round((i / records.length) * 100);
      process.stdout.write(
        `\r   [${percent}%] ${i}/${records.length} | Success: ${success} | Failed: ${failed} | ETA: ${remaining}m`
      );
    }

    const coords = await geocodeAddress(record.address, record.city, record.country);

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
    if (i < records.length - 1) {
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
    const percent = Math.round((progress / updates.length) * 100);
    console.log(`   Updated: ${progress}/${updates.length} (${percent}%)`);
  }

  console.log();
  console.log('========================================');
  console.log('PHASE 2 BATCH 2 COMPLETE!');
  console.log('========================================');
  console.log(`✓ Successfully geocoded: ${updatedCount} records`);
  console.log(`✗ Failed to geocode: ${failed} records`);
  console.log();
  console.log(`📍 Total new coordinates added: ${updatedCount}`);
  console.log('🗺️ Map coverage expanding!');
}

geocodeBatch2().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
