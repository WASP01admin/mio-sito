#!/usr/bin/env node

/**
 * Export problematic US +1 records and clear their bad coordinates
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { stringify } = require('csv-stringify/sync');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixBadCoords() {
  console.log('========================================');
  console.log('EXPORTING & CLEARING BAD COORDINATES');
  console.log('========================================');
  console.log();

  // Step 1: Fetch all US +1 with bad coordinates
  console.log('1. Fetching problematic records...');
  const { data: badRecords, error } = await supabase
    .from('associations')
    .select('id, name, city, country, address, email, website, postal_code, phone')
    .eq('country', 'US +1')
    .eq('lat', 24.6666418)
    .limit(50000);

  if (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }

  console.log(`   Found ${badRecords.length} records with bad coordinates`);
  console.log();

  // Step 2: Export to CSV on Desktop
  console.log('2. Exporting to CSV...');
  const csv = stringify(badRecords, {
    header: true,
  });

  const desktopPath = `${process.env.USERPROFILE}\\Desktop\\problematic_us_plus1_records.csv`;
  fs.writeFileSync(desktopPath, csv, 'utf-8');
  console.log(`   ✓ Exported to: ${desktopPath}`);
  console.log(`   Records: ${badRecords.length}`);
  console.log();

  // Step 3: Clear coordinates in batches
  console.log('3. Clearing bad coordinates from database...');
  let clearedCount = 0;

  for (let i = 0; i < badRecords.length; i += 50) {
    const batch = badRecords.slice(i, i + 50);

    for (const record of batch) {
      const { error: updateError } = await supabase
        .from('associations')
        .update({ lat: null, lng: null })
        .eq('id', record.id);

      if (!updateError) {
        clearedCount++;
      }
    }

    const progress = Math.min(clearedCount, badRecords.length);
    console.log(`   Cleared: ${progress}/${badRecords.length}`);
  }

  console.log();
  console.log('========================================');
  console.log('DONE!');
  console.log('========================================');
  console.log(`✓ Cleared ${clearedCount} bad coordinates`);
  console.log(`✓ Exported list to Desktop`);
  console.log();
  console.log('Review the CSV to see what data these records have.');
  console.log('The map will update automatically!');
}

fixBadCoords().catch((err) => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
