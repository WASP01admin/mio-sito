#!/usr/bin/env node

/**
 * GEOCODE 3 CANADIAN ADDRESSES
 * Using OpenStreetMap Nominatim (free, no API key needed)
 */

const https = require('https');

const addresses = [
  {
    name: 'Brooks Animal Protection Society',
    address: '415 1 Avenue East, Brooks, AB T1R 1B2',
    code: 'CAN0044'
  },
  {
    name: 'Bide Awhile Animal Shelter Society',
    address: '67 Neptune Crescent, Dartmouth, NS B2Y 4W4',
    code: 'CAN0045'
  },
  {
    name: 'Angels of Hope Animal Rescue Inc.',
    address: 'Sumner St, Esterhazy, SK S0A 0X0',
    code: 'CAN0013'
  }
];

function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;

    https.get(url, { headers: { 'User-Agent': 'WASP-Geocoder' } }, (res) => {
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

async function geocodeAll() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  GEOCODING CANADIAN ADDRESSES             ║');
  console.log('║  (OpenStreetMap Nominatim)                ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  const results = [];

  for (const item of addresses) {
    process.stdout.write(`${item.name}... `);

    try {
      const coords = await geocodeAddress(item.address);

      if (coords) {
        console.log(`✓ ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        results.push({
          code: item.code,
          name: item.name,
          address: item.address,
          lat: coords.lat,
          lng: coords.lng
        });
      } else {
        console.log('✗ No results found');
      }
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
    }

    // Rate limit: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  RESULTS                                  ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  if (results.length === 0) {
    console.log('No coordinates found.\n');
    return;
  }

  console.log('CSV format (for database update):\n');
  console.log('code,lat,lng');
  results.forEach(r => {
    console.log(`${r.code},${r.lat.toFixed(6)},${r.lng.toFixed(6)}`);
  });

  console.log('\nDetails:\n');
  results.forEach(r => {
    console.log(`${r.code} - ${r.name}`);
    console.log(`  Address: ${r.address}`);
    console.log(`  Coords: ${r.lat.toFixed(6)}, ${r.lng.toFixed(6)}\n`);
  });
}

geocodeAll().catch(err => {
  console.error('\n✗ ERROR:', err.message);
  process.exit(1);
});
