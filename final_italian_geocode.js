#!/usr/bin/env node

/**
 * FINAL ITALIAN GEOCODING PUSH
 * Get all 2,809 Italian OTH records on the map
 * Clean city names, use Nominatim with Italy, accept all valid coords
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeItalianCity(city) {
  if (!city) return null;

  // Clean city name: remove province codes like "(TO)", "(RM)", etc.
  const cleanCity = city.split('(')[0].trim();
  if (!cleanCity) return null;

  const query = `${cleanCity}, Italy`;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'WASP-Final-Italian-Push/1.0',
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

async function finalItalianGeocoding() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  FINAL ITALIAN GEOCODING PUSH          ║');
  console.log('║  Get ALL 2,809 OTH records on the map! ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Get all OTH records without coordinates
  console.log('1. Fetching 2,809 OTH records without coordinates...');
  const { data: othRecords, count } = await supabase
    .from('associations')
    .select('id, code, name, city, country')
    .ilike('code', 'OTH%')
    .is('lat', null);

  console.log(`   Found ${othRecords?.length || 0} records to geocode\n`);

  if (!othRecords || othRecords.length === 0) {
    console.log('✓ All OTH records already geocoded!');
    process.exit(0);
  }

  // Geocode each record
  console.log('2. Geocoding Italian cities (1 per second)...');
  console.log(`   ETA: ~${Math.ceil(othRecords.length / 60)} minutes\n`);

  let success = 0;
  let failed = 0;
  const updates = [];
  const startTime = Date.now();

  for (let i = 0; i < othRecords.length; i++) {
    const record = othRecords[i];

    if (i % 100 === 0 && i > 0) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const rate = i > 0 ? i / (elapsed / 60) : 0;
      const remaining = i > 0 ? Math.ceil((othRecords.length - i) / rate) : 0;
      const percent = Math.round((i / othRecords.length) * 100);
      process.stdout.write(
        `\r   [${percent}%] ${i}/${othRecords.length} | Success: ${success} | Failed: ${failed} | ETA: ${remaining}m`
      );
    }

    const coords = await geocodeItalianCity(record.city);

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
    if (i < othRecords.length - 1) {
      await sleep(1000);
    }
  }

  console.log(`\n   Complete!\n`);

  // Update Supabase
  console.log('3. Updating Supabase with Italian coordinates...');

  let updatedCount = 0;
  for (let i = 0; i < updates.length; i += 100) {
    const batch = updates.slice(i, i + 100);

    for (const update of batch) {
      const { error: updateError } = await supabase
        .from('associations')
        .update({ lat: update.lat, lng: update.lng })
        .eq('id', update.id);

      if (!updateError) {
        updatedCount++;
      }
    }

    if ((i + 100) % 200 === 0 || i + 100 >= updates.length) {
      const percent = Math.round(((i + 100) / updates.length) * 100);
      console.log(`   Updated: ${Math.min(i + 100, updates.length)}/${updates.length} (${percent}%)`);
    }
  }

  console.log();
  console.log('╔════════════════════════════════════════╗');
  console.log('║         FINAL PUSH COMPLETE!           ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✓ Successfully geocoded: ${updatedCount} Italian organizations`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`\n🇮🇹 Italia is NOW on the map!\n`);
}

finalItalianGeocoding().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
