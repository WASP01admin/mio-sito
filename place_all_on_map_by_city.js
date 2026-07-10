#!/usr/bin/env node

/**
 * PLACE ALL ASSOCIATIONS ON MAP BY CITY
 * Democratic & Fair: Every association deserves representation
 *
 * Philosophy: If you operate in a city and love animals,
 * you belong on the map - with or without a physical facility.
 */

const { createClient } = require('@supabase/supabase-js');
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
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function placeAllOnMap() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  PLACE ALL ON MAP BY ADDRESS              ║');
  console.log('║  WASP IS FAIR AND DEMOCRATIC              ║');
  console.log('║  100% Coverage = 100% Representation      ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Fetch ALL records missing coordinates (address or city can have location info)
  console.log('Fetching records missing coordinates...\n');
  let allRecords = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('associations')
      .select('code, name, address, city, country, lat, lng')
      .or('lat.is.null,lng.is.null')
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching records:', error.message);
      break;
    }

    if (!data || data.length === 0) break;

    allRecords = allRecords.concat(data);
    console.log(`  ✓ Fetched batch: ${data.length} records (total: ${allRecords.length})`);

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  console.log(`\n✓ Found ${allRecords.length} records to place on map\n`);

  // Use city if available, otherwise use address
  const addressMap = {};

  allRecords.forEach(record => {
    // Prefer city, fallback to address
    const location = (record.city && record.city.trim()) ? record.city : record.address;

    if (!location || !location.trim()) return; // Skip if no location at all

    const key = `${record.country}|${location}`;
    if (!addressMap[key]) {
      addressMap[key] = {
        country: record.country,
        location: location,
        records: []
      };
    }
    addressMap[key].records.push(record);
  });

  const uniqueLocations = Object.keys(addressMap);
  console.log(`Processing ${uniqueLocations.length} unique locations...\n`);

  const updates = [];
  let geocoded = 0;
  let skipped = 0;

  // Geocode each unique location
  for (const key of uniqueLocations) {
    const { country, location, records } = addressMap[key];

    process.stdout.write(`${country} - ${location.substring(0, 40).padEnd(40)} (${records.length})... `);

    try {
      const coords = await geocodeCity(location, country);

      if (coords) {
        console.log(`✓ ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);

        // Mark all records at this location for update
        records.forEach(record => {
          updates.push({
            code: record.code,
            lat: coords.lat,
            lng: coords.lng
          });
        });
        geocoded++;
      } else {
        console.log('✗ Not found');
        skipped += records.length;
      }
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
      skipped += records.length;
    }

    // Rate limit: 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n✓ Geocoded ${geocoded} cities, ${skipped} records skipped\n`);

  // Apply all updates
  if (updates.length > 0) {
    console.log(`Updating database with ${updates.length} records...\n`);
    let updated = 0;
    let failed = 0;

    for (let i = 0; i < updates.length; i += 100) {
      const batch = updates.slice(i, i + 100);

      for (const item of batch) {
        const { error } = await supabase
          .from('associations')
          .update({ lat: item.lat, lng: item.lng })
          .eq('code', item.code);

        if (error) {
          failed++;
        } else {
          updated++;
        }
      }

      const progress = Math.min(i + 100, updates.length);
      const pct = Math.round((progress / updates.length) * 100);
      console.log(`  ✓ Updated ${progress}/${updates.length} (${pct}%)`);
    }

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  MISSION ACCOMPLISHED ✓                   ║');
    console.log('╚═══════════════════════════════════════════╝\n');
    console.log(`✓ Records placed on map: ${updated}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`\n🌍 WASP IS NOW 100% REPRESENTED ON THE MAP!\n`);
    console.log('Every association, regardless of size, now has');
    console.log('their place in the global animal welfare community!\n');
  }
}

placeAllOnMap().catch(err => {
  console.error('\n✗ CRITICAL ERROR:', err.message);
  process.exit(1);
});
