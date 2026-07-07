#!/usr/bin/env node

/**
 * EXPORT ASSOCIATIONS MISSING COORDINATES
 * Create CSV of all associations without lat/lng
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function exportMissingCoords() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  EXPORT MISSING COORDINATES               ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Fetch all records missing coordinates (paginated)
  const missingRecords = [];
  let offset = 0;
  const pageSize = 1000;

  console.log('Fetching all associations without coordinates...\n');

  while (true) {
    const { data, error } = await supabase
      .from('associations')
      .select('code, name, country, address, city, website')
      .or('lat.is.null,lng.is.null')
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error:', error);
      break;
    }

    if (!data || data.length === 0) break;

    missingRecords.push(...data);
    console.log(`  Fetched: ${missingRecords.length} records`);

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  console.log(`\n✓ Total records without coordinates: ${missingRecords.length}\n`);

  // Count by country
  const byCountry = {};
  missingRecords.forEach(r => {
    byCountry[r.country] = (byCountry[r.country] || 0) + 1;
  });

  console.log('Missing coordinates by country:');
  Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, count]) => {
      console.log(`  ${country.padEnd(20)} ${count}`);
    });

  // Create CSV
  const csvHeader = 'code,country,name,address,city,website\n';
  const csvRows = missingRecords.map(r => {
    const escapedName = `"${(r.name || '').replace(/"/g, '""')}"`;
    const escapedAddr = `"${(r.address || '').replace(/"/g, '""')}"`;
    const escapedCity = `"${(r.city || '').replace(/"/g, '""')}"`;
    const escapedWeb = `"${(r.website || '').replace(/"/g, '""')}"`;

    return `${r.code},${r.country},${escapedName},${escapedAddr},${escapedCity},${escapedWeb}`;
  }).join('\n');

  const csv = csvHeader + csvRows;
  fs.writeFileSync('missing_coordinates.csv', csv);

  console.log(`\n✓ Created missing_coordinates.csv with ${missingRecords.length} records\n`);
}

exportMissingCoords().catch(err => {
  console.error('✗ ERROR:', err.message);
  process.exit(1);
});
