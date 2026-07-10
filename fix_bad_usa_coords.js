#!/usr/bin/env node

/**
 * FIX BAD USA COORDINATES
 * Clear the 1,000 USA records stuck at 24.6666, -81.3856
 * Then re-geocode them properly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeAddress(address, city, state, country = 'USA') {
  if (!address && !city && !state) return null;

  const parts = [address, city, state, country].filter(x => x && x.trim());
  const query = parts.join(', ');

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'WASP-USA-Fixer/1.0',
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

async function fixBadCoords() {
  console.log('========================================');
  console.log('FIXING BAD USA COORDINATES');
  console.log('========================================\n');

  // Step 1: Get all records with bad Caribbean coordinate
  console.log('1. Finding records with bad Caribbean coordinate...');
  const { data: badRecords, count } = await supabase
    .from('associations')
    .select('id, code, name, address, city, country')
    .eq('country', 'US +1')
    .eq('lat', 24.6666418)
    .eq('lng', -81.3856418);

  console.log(`   Found ${count} records with bad coordinate\n`);

  if (!badRecords || badRecords.length === 0) {
    console.log('No bad records found!');
    process.exit(0);
  }

  // Step 2: Extract state from organization names
  // e.g., "Alaska Humane Society" -> "Alaska" -> "AK"
  const stateMap = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY'
  };

  const extractState = (name) => {
    for (const [state, code] of Object.entries(stateMap)) {
      if (name.includes(state)) return code;
    }
    return null;
  };

  // Step 3: Clear coordinates and prepare for re-geocoding
  console.log('2. Clearing bad coordinates...');
  const { error: clearError } = await supabase
    .from('associations')
    .update({ lat: null, lng: null })
    .eq('country', 'US +1')
    .eq('lat', 24.6666418)
    .eq('lng', -81.3856418);

  if (!clearError) {
    console.log(`   ✓ Cleared ${count} bad coordinates\n`);
  }

  // Step 4: Geocode with state + city
  console.log('3. Re-geocoding with extracted state data (1 per second)...');
  console.log(`   ETA: ~${Math.ceil(badRecords.length / 60)} minutes\n`);

  let success = 0;
  let failed = 0;
  const updates = [];
  const startTime = Date.now();

  for (let i = 0; i < badRecords.length; i++) {
    const record = badRecords[i];

    if (i % 50 === 0) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const rate = i > 0 ? i / (elapsed / 60) : 0;
      const remaining = i > 0 ? Math.ceil((badRecords.length - i) / rate) : 0;
      const percent = Math.round((i / badRecords.length) * 100);
      process.stdout.write(
        `\r   [${percent}%] ${i}/${badRecords.length} | Success: ${success} | Failed: ${failed} | ETA: ${remaining}m`
      );
    }

    const state = extractState(record.name);
    const coords = await geocodeAddress(
      record.address,
      record.city,
      state,
      'USA'
    );

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

    if (i < badRecords.length - 1) {
      await sleep(1000);
    }
  }

  console.log(`\n   Complete!\n`);

  // Step 5: Update database
  console.log('4. Updating Supabase with corrected coordinates...');

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
  console.log('FIX COMPLETE!');
  console.log('========================================');
  console.log(`✓ Bad coordinates cleared: ${count}`);
  console.log(`✓ Successfully geocoded: ${updatedCount}`);
  console.log(`✗ Failed to geocode: ${failed}`);
  console.log();
  console.log('🎯 USA associations are now properly mapped!');
}

fixBadCoords().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
