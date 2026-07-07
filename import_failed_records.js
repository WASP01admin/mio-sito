#!/usr/bin/env node

/**
 * PHASE 1: Import 2,809 failed records to Supabase
 * These records have FULL data - just weren't imported before
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const path = require('path');
const CSV_FILE = path.join(process.env.USERPROFILE, 'Desktop', 'Associations LISTS', 'failed_records_for_review.csv');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Generate association code (3-letter country + 4-digit sequential)
function generateCode(country, sequence) {
  const countryMap = {
    'Italy': 'ITA',
    'AUSTRALIA +61': 'AUS',
    'CANADA +1': 'CAN',
    'USA': 'USA',
    'UK +44': 'GBR',
    'IRELAND +353': 'IRL',
  };

  let code = countryMap[country] || country.substring(0, 3).toUpperCase();
  code += String(sequence).padStart(4, '0');
  return code;
}

// Extract country code from country name
function getCountryCode(country) {
  const codeMap = {
    'Italy': 'IT',
    'AUSTRALIA +61': 'AU',
    'CANADA +1': 'CA',
    'USA': 'US',
    'UK +44': 'GB',
    'IRELAND +353': 'IE',
  };
  return codeMap[country] || 'XX';
}

async function importFailed() {
  console.log('========================================');
  console.log('PHASE 1: IMPORTING 2,809 FAILED RECORDS');
  console.log('========================================');
  console.log();

  // Read CSV
  console.log('1. Reading failed records CSV...');
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`ERROR: File not found: ${CSV_FILE}`);
    process.exit(1);
  }

  try {
    const fileContent = fs.readFileSync(CSV_FILE, 'latin1'); // Use latin1 for encoding
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
    });

    console.log(`   Successfully parsed ${records.length} records`);

    // Verify first record
    if (records.length > 0) {
      console.log(`   Sample: ${records[0].name} (${records[0].country})`);
    }
  } catch (parseErr) {
    console.error(`ERROR parsing CSV: ${parseErr.message}`);
    process.exit(1);
  }

  console.log(`   Found ${records.length} records to import`);
  console.log();

  // Group by country to generate codes
  const byCountry = {};
  records.forEach(r => {
    const country = r.country || 'Unknown';
    if (!byCountry[country]) byCountry[country] = [];
    byCountry[country].push(r);
  });

  console.log('   Country breakdown:');
  Object.entries(byCountry).forEach(([country, recs]) => {
    console.log(`     ${country}: ${recs.length}`);
  });
  console.log();

  // Prepare records for insertion
  console.log('2. Preparing records for import...');
  const toInsert = [];
  let sequence = 1;

  records.forEach(record => {
    const country = record.country || 'Unknown';
    const code = generateCode(country, sequence);
    sequence++;

    toInsert.push({
      code: code,
      name: record.name || '',
      city: record.city || '',
      country: country,
      address: record.address || '',
      postal_code: record.postal_code || '',
      email: record.email || '',
      phone: record.phone || '',
      website: record.website || '',
      lat: null, // Will geocode in Phase 2
      lng: null,
    });
  });

  console.log(`   Prepared ${toInsert.length} records`);
  console.log();

  // Insert in batches
  console.log('3. Inserting into Supabase...');
  const BATCH_SIZE = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toInsert.length / BATCH_SIZE);

    try {
      const { error } = await supabase.from('associations').insert(batch);

      if (error) {
        console.error(
          `   ❌ Batch ${batchNum}/${totalBatches}: ${error.message}`
        );
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        const progress = Math.min(successCount + errorCount, toInsert.length);
        const percent = Math.round((progress / toInsert.length) * 100);
        console.log(
          `   ✓ Batch ${batchNum}/${totalBatches} (${progress}/${toInsert.length} - ${percent}%)`
        );
      }
    } catch (err) {
      console.error(`   ❌ Batch ${batchNum}/${totalBatches}: ${err.message}`);
      errorCount += batch.length;
    }
  }

  console.log();
  console.log('========================================');
  console.log('PHASE 1 COMPLETE!');
  console.log('========================================');
  console.log(`✓ Successfully imported: ${successCount} records`);
  if (errorCount > 0) {
    console.log(`✗ Failed: ${errorCount} records`);
  }
  console.log();
  console.log('🎯 Ready for Phase 2: GEOCODING!');
}

importFailed().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
