#!/usr/bin/env node

/**
 * Re-geocode US +1 records with better logic
 * Extracts city from organization name (e.g., "Alaska Humane Society (Anchorage)" -> "Anchorage, USA")
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Extract city from parentheses in name, e.g., "Org Name (City)" -> "City"
function extractCity(name) {
  const match = name.match(/\(([^)]+)\)$/);
  if (match) {
    const city = match[1].trim();
    // Filter out common non-city strings
    if (city.length > 1 && !city.match(/^(USA|US|United States|Inc|Ltd|LLC|ONLUS)$/i)) {
      return city;
    }
  }
  return null;
}

// Geocode a single address using Nominatim
async function geocodeAddress(name, city) {
  if (!city) {
    return null;
  }

  const query = city + ', USA';

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

    if (!response.ok) {
      return null;
    }

    const results = await response.json();
    if (results.length === 0) {
      return null;
    }

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
    };
  } catch (error) {
    return null;
  }
}

async function regeocode() {
  console.log('========================================');
  console.log('RE-GEOCODING US +1 ASSOCIATIONS');
  console.log('========================================');
  console.log();

  // Step 1: Get all US +1 associations with bad coordinates
  console.log('1. Fetching US +1 associations with fallback coordinates...');
  const { data: associations, error } = await supabase
    .from('associations')
    .select('id, name, lat, lng')
    .eq('country', 'US +1')
    .eq('lat', 24.6666418)
    .limit(50000);

  if (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }

  console.log(`   Found ${associations.length} associations with bad coordinates`);
  console.log();

  if (associations.length === 0) {
    console.log('✓ No bad coordinates found!');
    process.exit(0);
  }

  // Step 2: Extract cities and geocode
  console.log('2. Extracting cities from names and re-geocoding...');
  let success = 0;
  let failed = 0;
  let noCityFound = 0;
  const updates = [];

  for (let i = 0; i < associations.length; i++) {
    const assoc = associations[i];
    const city = extractCity(assoc.name);

    process.stdout.write(
      `\r   Progress: ${i + 1}/${associations.length} (${success} fixed, ${failed} failed, ${noCityFound} no city)`
    );

    if (!city) {
      noCityFound++;
    } else {
      const coords = await geocodeAddress(assoc.name, city);

      if (coords) {
        updates.push({
          id: assoc.id,
          lat: coords.lat,
          lng: coords.lng,
        });
        success++;
      } else {
        failed++;
      }

      // Rate limit: wait 1 second between requests
      if (i < associations.length - 1) {
        await sleep(1000);
      }
    }
  }

  console.log(
    `\n   Re-geocoded: ${success} | Failed: ${failed} | No city found: ${noCityFound}\n`
  );

  // Step 3: Update Supabase with new coordinates
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

    const progress = Math.min(updatedCount, updates.length);
    console.log(`   Updated: ${progress}/${updates.length}`);
  }

  console.log();
  console.log('========================================');
  console.log('RE-GEOCODING COMPLETE');
  console.log('========================================');
  console.log(`✓ Successfully re-geocoded: ${updatedCount} associations`);
  console.log(`✗ Failed to geocode: ${failed} associations`);
  console.log(`⚠ No city found in name: ${noCityFound} associations`);
  console.log();
  console.log('Refresh your map to see the updated locations!');
}

regeocode().catch((err) => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
