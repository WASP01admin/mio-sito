#!/usr/bin/env node

/**
 * UPDATE IRELAND BY CITY
 * Geocode cities and place all associations on map
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function geocodeCity(city, country) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const query = `${city}, ${country}`;
    const encoded = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;

    https.get(url, { headers: { 'User-Agent': 'WASP-Democratic-Map' } }, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results && results.length > 0) {
            resolve({
              lat: parseFloat(results[0].lat),
              lng: parseFloat(results[0].lon)
            });
          } else {
            resolve(null);
          }
        } catch (err) {
          // If JSON parsing fails (XML error response from API), treat as not found
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

async function updateIreland() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  UPDATE IRELAND BY CITY                   ║');
  console.log('║  WASP IS FAIR AND DEMOCRATIC              ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Read the CSV
  const csvPath = 'ireland_cities_extracted.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.trim().split('\n');

  // Parse CSV (skip header)
  const records = lines.slice(1).map(line => {
    const [code, city] = line.split(',').map(s => s.trim());
    return { code, city };
  });

  console.log(`Found ${records.length} Ireland associations\n`);

  // Group by city to avoid duplicate geocoding
  const cityMap = {};
  records.forEach(record => {
    if (!cityMap[record.city]) {
      cityMap[record.city] = [];
    }
    cityMap[record.city].push(record.code);
  });

  console.log(`Geocoding ${Object.keys(cityMap).length} unique cities...\n`);

  const updates = [];
  let geocoded = 0;
  let skipped = 0;

  // Geocode each city
  for (const [city, codes] of Object.entries(cityMap)) {
    process.stdout.write(`${city.padEnd(40)} (${codes.length})... `);

    try {
      const coords = await geocodeCity(city, 'Ireland');

      if (coords) {
        console.log(`✓ ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);

        // Add update for each code in this city
        codes.forEach(code => {
          updates.push({
            code,
            lat: coords.lat,
            lng: coords.lng
          });
        });
        geocoded++;
      } else {
        console.log('✗ Not found');
        skipped += codes.length;
      }
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
      skipped += codes.length;
    }

    // Rate limit: 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n✓ Geocoded ${geocoded} cities, ${skipped} records skipped\n`);

  // Apply updates
  if (updates.length > 0) {
    console.log(`Updating database with ${updates.length} records...\n`);
    let updated = 0;
    let failed = 0;

    for (const item of updates) {
      const { error } = await supabase
        .from('associations')
        .update({ lat: item.lat, lng: item.lng })
        .eq('code', item.code)
        .eq('country', 'Ireland');

      if (error) {
        failed++;
      } else {
        updated++;
      }
    }

    const progress = Math.round((updated / updates.length) * 100);
    console.log(`  ✓ Updated ${updated}/${updates.length} (${progress}%)`);

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  IRELAND COMPLETE ✓                      ║');
    console.log('╚═══════════════════════════════════════════╝\n');
    console.log(`✓ Records placed on map: ${updated}`);
    console.log(`✗ Failed: ${failed}\n`);
  }
}

updateIreland().catch(err => {
  console.error('\n✗ ERROR:', err.message);
  process.exit(1);
});
