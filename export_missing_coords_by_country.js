#!/usr/bin/env node

/**
 * EXPORT MISSING COORDINATES BY COUNTRY
 * Creates separate CSVs for each country with records that need geocoding
 * For submission to Gemini for address-based lat/lng lookup
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function exportMissingCoords() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  EXPORT MISSING COORDINATES               ║');
  console.log('║  By Country - For Gemini Geocoding        ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  const countries = [
    'Italy',
    'Canada',
    'United Kingdom',
    'United States',
    'Australia',
    'New Zealand',
    'Ireland'
  ];

  const outputDir = path.join(process.cwd(), 'missing_coords_by_country');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  let totalMissing = 0;

  for (const country of countries) {
    console.log(`Processing: ${country}...`);

    // Fetch records without coordinates
    let allRecords = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('associations')
        .select('code, name, address, city, email, phone, website')
        .eq('country', country)
        .or('lat.is.null,lng.is.null')
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error(`  ✗ Error fetching ${country}:`, error.message);
        break;
      }

      if (!data || data.length === 0) break;

      allRecords = allRecords.concat(data);

      if (data.length < pageSize) break;
      offset += pageSize;
    }

    if (allRecords.length === 0) {
      console.log(`  ✓ ${country}: 0 records missing coordinates\n`);
      continue;
    }

    // Export to CSV
    const filename = `${country.toLowerCase().replace(/\s+/g, '_')}_missing_coords.csv`;
    const filepath = path.join(outputDir, filename);

    const headers = ['code', 'name', 'address', 'city', 'email', 'phone', 'website'];
    const csvLines = [headers.join(',')];

    allRecords.forEach(record => {
      const values = headers.map(header => {
        const val = record[header] || '';
        const str = String(val);
        // Escape quotes and wrap if contains comma
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvLines.push(values.join(','));
    });

    fs.writeFileSync(filepath, csvLines.join('\n'));
    console.log(`  ✓ ${country}: ${allRecords.length} records → ${filename}`);
    totalMissing += allRecords.length;
  }

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  EXPORT COMPLETE ✓                        ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  console.log(`Total records missing coordinates: ${totalMissing}`);
  console.log(`Output directory: ${outputDir}\n`);
  console.log('Files ready for Gemini geocoding:');
  console.log(`  1. italy_missing_coords.csv`);
  console.log(`  2. canada_missing_coords.csv`);
  console.log(`  3. united_kingdom_missing_coords.csv`);
  console.log(`  4. united_states_missing_coords.csv`);
  console.log(`  5. australia_missing_coords.csv`);
  console.log(`  6. new_zealand_missing_coords.csv`);
  console.log(`  7. ireland_missing_coords.csv\n`);
  console.log('Each file contains: code, name, address, city, email, phone, website');
  console.log('Use with Gemini to extract lat/lng from addresses\n');
}

exportMissingCoords().catch(err => {
  console.error('\n✗ ERROR:', err.message);
  process.exit(1);
});
