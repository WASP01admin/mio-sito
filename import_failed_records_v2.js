#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CSV_FILE = path.join(process.env.USERPROFILE, 'Desktop', 'Associations LISTS', 'failed_records_for_review.csv');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateCode(country, sequence) {
  const countryMap = {
    'Italy': 'ITA',
    'AUSTRALIA +61': 'AUS',
    'CANADA +1': 'CAN',
  };
  let code = countryMap[country] || 'OTH';
  code += String(sequence).padStart(4, '0');
  return code;
}

async function importFailed() {
  console.log('========================================');
  console.log('PHASE 1: IMPORTING 2,809 FAILED RECORDS');
  console.log('========================================');
  console.log();

  console.log('1. Reading CSV file...');
  try {
    const fileContent = fs.readFileSync(CSV_FILE, 'latin1');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
    });

    console.log(`   ✓ Found ${records.length} records\n`);

    // Prepare for insertion
    console.log('2. Preparing records for import...');
    const toInsert = [];

    records.forEach((record, idx) => {
      toInsert.push({
        code: generateCode(record.country, idx + 1),
        name: (record.name || '').substring(0, 255),
        city: (record.city || '').substring(0, 100),
        country: (record.country || 'Unknown').substring(0, 100),
        address: (record.address || '').substring(0, 500),
        postal_code: (record.postal_code || '').substring(0, 20),
        email: (record.email || '').substring(0, 100),
        phone: (record.phone || '').substring(0, 50),
        website: (record.website || '').substring(0, 255),
        lat: null,
        lng: null,
      });
    });

    console.log(`   ✓ Prepared ${toInsert.length} records\n`);

    // Import in batches
    console.log('3. Importing to Supabase...');
    const BATCH_SIZE = 100;
    let successCount = 0;

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(toInsert.length / BATCH_SIZE);

      const { error } = await supabase.from('associations').insert(batch);

      if (error) {
        console.log(`   ✗ Batch ${batchNum}/${totalBatches}: ${error.message}`);
      } else {
        successCount += batch.length;
        const percent = Math.round((successCount / toInsert.length) * 100);
        console.log(`   ✓ Batch ${batchNum}/${totalBatches} (${successCount}/${toInsert.length} - ${percent}%)`);
      }
    }

    console.log('\n========================================');
    console.log('✓ IMPORT COMPLETE!');
    console.log('========================================');
    console.log(`✓ Imported: ${successCount} records`);
    console.log('\n🎯 Ready for Phase 2: GEOCODING!');
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  }
}

importFailed();
