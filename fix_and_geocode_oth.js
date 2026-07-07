#!/usr/bin/env node

/**
 * FIX AND GEOCODE: Update country fields and geocode OTH records
 * Many OTH records have country="Unknown" and need to be set to "Italy"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeAddress(city, country) {
  if (!city) return null;

  // Extract just the city name (remove province code if present)
  // e.g., "Chieri (TO)" -> "Chieri"
  const cityName = city.split('(')[0].trim();
  const query = `${cityName}, ${country}`;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'WASP-OTH-Fixer/1.0',
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

async function fixAndGeocode() {
  console.log('========================================');
  console.log('FIXING AND GEOCODING OTH RECORDS');
  console.log('========================================\n');

  // Step 1: Fix country values for Italian organizations
  console.log('1. Fixing country values for OTH records...');

  // First, update OTH records with country="Unknown" to "Italy"
  const { data: unknownOTH } = await supabase
    .from('associations')
    .select('id, code, name, city')
    .ilike('code', 'OTH%')
    .eq('country', 'Unknown')
    .limit(5000);

  console.log(`   Found ${unknownOTH?.length || 0} OTH records with country="Unknown"`);

  if (unknownOTH && unknownOTH.length > 0) {
    // Bulk update to Italy
    const { error: updateError } = await supabase
      .from('associations')
      .update({ country: 'Italy' })
      .ilike('code', 'OTH%')
      .eq('country', 'Unknown');

    if (!updateError) {
      console.log(`   ✓ Updated ${unknownOTH.length} records to Italy`);
    }
  }

  // Step 2: Get all OTH records without coordinates
  console.log('\n2. Fetching OTH records without coordinates...');

  const { data: toGeocode } = await supabase
    .from('associations')
    .select('id, name, city, country')
    .ilike('code', 'OTH%')
    .is('lat', null)
    .limit(5000);

  console.log(`   Found ${toGeocode?.length || 0} records to geocode\n`);

  if (!toGeocode || toGeocode.length === 0) {
    console.log('✓ All OTH records already geocoded!');
    process.exit(0);
  }

  // Step 3: Geocode using city + country only
  console.log('3. Geocoding by city + country (1 per second)...');
  console.log(`   ETA: ~${Math.ceil(toGeocode.length / 60)} minutes\n`);

  let success = 0;
  let failed = 0;
  const updates = [];
  const startTime = Date.now();

  for (let i = 0; i < toGeocode.length; i++) {
    const record = toGeocode[i];

    if (i % 50 === 0) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const rate = i > 0 ? i / (elapsed / 60) : 0;
      const remaining = i > 0 ? Math.ceil((toGeocode.length - i) / rate) : 0;
      const percent = Math.round((i / toGeocode.length) * 100);
      process.stdout.write(
        `\r   [${percent}%] ${i}/${toGeocode.length} | Success: ${success} | Failed: ${failed} | ETA: ${remaining}m`
      );
    }

    const coords = await geocodeAddress(record.city, record.country);

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

    if (i < toGeocode.length - 1) {
      await sleep(1000);
    }
  }

  console.log(`\n   Complete!\n`);

  // Step 4: Update database
  console.log('4. Updating Supabase with coordinates...');

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

    if ((i + 50) % 100 === 0 || i + 50 >= updates.length) {
      const percent = Math.round(((i + 50) / updates.length) * 100);
      console.log(`   Updated: ${Math.min(i + 50, updates.length)}/${updates.length} (${percent}%)`);
    }
  }

  console.log();
  console.log('========================================');
  console.log('FIX AND GEOCODE COMPLETE!');
  console.log('========================================');
  console.log(`✓ Country values fixed: ${unknownOTH?.length || 0}`);
  console.log(`✓ Successfully geocoded: ${updatedCount} records`);
  console.log(`✗ Failed to geocode: ${failed} records`);
  console.log();
  console.log('🎯 Italian organizations are on the map!');
}

fixAndGeocode().catch(err => {
  console.error('FATAL ERROR:', err.message);
  process.exit(1);
});
