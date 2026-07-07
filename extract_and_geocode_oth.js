#!/usr/bin/env node

/**
 * EXTRACT CITIES FROM OTH NAMES + GEOCODE
 * Cities are hidden in parentheses in org names
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractCity(name) {
  // Extract text in parentheses: "Org Name (City)" -> "City"
  const match = name.match(/\(([^)]+)\)/);
  if (match) {
    return match[1].trim();
  }
  return null;
}

async function geocode(city, country) {
  if (!city) return null;

  const query = `${city}, ${country}`;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'WASP-OTH-Extract/1.0',
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

async function extractAndGeocode() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  EXTRACT CITIES FROM NAMES + GEOCODE   ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Get remaining OTH records
  console.log('1. Fetching OTH records...');
  const { data: othRecords } = await supabase
    .from('associations')
    .select('id, code, name, country')
    .ilike('code', 'OTH%')
    .is('lat', null);

  console.log(`   Found ${othRecords?.length} records\n`);

  if (!othRecords || othRecords.length === 0) {
    console.log('✓ All OTH records geocoded!');
    process.exit(0);
  }

  // Extract cities and geocode
  console.log('2. Extracting cities from names and geocoding...');
  console.log(`   ETA: ~${Math.ceil(othRecords.length / 60)} minutes\n`);

  let extracted = 0;
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
        `\r   [${percent}%] ${i}/${othRecords.length} | Extracted: ${extracted} | Success: ${success} | Failed: ${failed} | ETA: ${remaining}m`
      );
    }

    const city = extractCity(record.name);

    if (city) {
      extracted++;
      const coords = await geocode(city, record.country);

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

    if ((i + 50) % 100 === 0 || i + 50 >= updates.length) {
      const percent = Math.round(((i + 50) / updates.length) * 100);
      console.log(`   Updated: ${Math.min(i + 50, updates.length)}/${updates.length} (${percent}%)`);
    }
  }

  console.log();
  console.log('╔════════════════════════════════════════╗');
  console.log('║    EXTRACTION + GEOCODING COMPLETE!    ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✓ Cities extracted: ${extracted}`);
  console.log(`✓ Successfully geocoded: ${updatedCount}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`\n🎯 OTH associations are NOW spread worldwide!\n`);
}

extractAndGeocode().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
