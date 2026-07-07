#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importFailed() {
  console.log('========================================');
  console.log('PHASE 1: IMPORTING 2,809 FAILED RECORDS');
  console.log('========================================');
  console.log();

  console.log('1. Reading CSV file (streaming)...');

  const records = [];
  let headerRow = true;
  let headers = [];

  const rl = readline.createInterface({
    input: fs.createReadStream('./failed_records.csv'),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (headerRow) {
      headers = line.split(',');
      headerRow = false;
      continue;
    }

    // Simple CSV parsing (assumes no commas in values)
    const values = line.split(',');
    const record = {};
    headers.forEach((h, i) => {
      record[h.trim()] = (values[i] || '').trim();
    });

    records.push(record);
  }

  console.log(`   ✓ Read ${records.length} records\n`);

  console.log('2. Preparing for import...');
  const toInsert = [];

  records.forEach((record, idx) => {
    toInsert.push({
      code: `OTH${String(idx + 1).padStart(4, '0')}`,
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
}

importFailed().catch(err => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
