#!/usr/bin/env node

/**
 * GEOCODE ITALY MISSING COORDINATES
 * Geocode the 554 Italian associations (ITA0001-ITA0955) that are missing coordinates
 * EXCLUDES PIEMONTE (ITA0956+)
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

async function geocodeItalyMissing() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  GEOCODE ITALY MISSING (Excluding PIEMONTE)  ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Fetch Italian records without coords (excluding PIEMONTE which starts at ITA0956)
  console.log('1. Fetching Italian associations without coordinates...');
  const { data: records, error } = await supabase
    .from('associations')
    .select('id, code, name, address, city, country')
    .eq('country', 'Italy')
    .lt('code', 'ITA0956')
    .is('lat', null);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`   ✓ Found ${records?.length || 0} Italian records without coordinates\n`);

  if (!records || records.length === 0) {
    console.log('✓ All Italian associations have coordinates!');
    process.exit(0);
  }

  // Geocode records
  console.log('2. Geocoding addresses...');
  const toUpdate = [];
  let success = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const address = rec.address || '';
    const city = rec.city || '';

    const coords = await geocode(address, city, 'Italy');

    if (coords) {
      success++;
      toUpdate.push({
        id: rec.id,
        code: rec.code,
        name: rec.name,
        lat: coords.lat,
        lng: coords.lng
      });
    } else {
      failed++;
    }

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

  // Update database
  console.log('3. Updating database...');
  let updated = 0;

  for (const rec of toUpdate) {
    const { error: updateError } = await supabase
      .from('associations')
      .update({ lat: rec.lat, lng: rec.lng })
      .eq('id', rec.id);

    if (!updateError) {
      updated++;
      process.stdout.write(`\r   Updated: ${updated}/${toUpdate.length}`);
    }
  }

  console.log('\n\n╔════════════════════════════════════════╗');
  console.log('║         GEOCODING COMPLETE!            ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✓ Geocoded and updated: ${updated}/${records.length}`);
  console.log(`✗ Still missing coords: ${records.length - updated}\n`);

  // Show sample of updated records
  console.log('📍 Sample of updated records:');
  toUpdate.slice(0, 10).forEach(r => {
    console.log(`   ${r.code} | ${r.name.substring(0, 40).padEnd(40)} | ${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`);
  });
  if (toUpdate.length > 10) {
    console.log(`   ... and ${toUpdate.length - 10} more\n`);
  } else {
    console.log();
  }
}

geocodeItalyMissing().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
