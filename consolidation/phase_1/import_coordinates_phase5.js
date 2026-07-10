#!/usr/bin/env node

/**
 * PHASE 5: Import Coordinates to Supabase
 * Reads holding_coordinates.csv and links to associations by name
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CSV_FILE = './coordinates/holding_coordinates.csv';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importCoordinates() {
  console.log('========================================');
  console.log('PHASE 5: COORDINATE IMPORT');
  console.log('========================================');
  console.log();

  // Step 1: Read coordinates CSV
  console.log('1. Reading coordinates file...');
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`ERROR: File not found: ${CSV_FILE}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const coordRecords = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`   Loaded ${coordRecords.length} coordinate pairs`);
  console.log();

  // Step 2: Fetch all associations for name matching
  console.log('2. Fetching associations from database...');
  const { data: associations, error: assocError } = await supabase
    .from('associations')
    .select('id, name, email')
    .limit(50000);  // Fetch up to 50k records (we have 3708)

  if (assocError) {
    console.error(`ERROR: ${assocError.message}`);
    process.exit(1);
  }

  console.log(`   Loaded ${associations.length} associations`);
  console.log();

  // Step 3: Build lookup table
  console.log('3. Building lookup table...');
  const nameLookup = {};
  const emailLookup = {};

  associations.forEach(assoc => {
    if (assoc.name) {
      const nameKey = assoc.name.toLowerCase().trim();
      nameLookup[nameKey] = assoc.id;
    }
    if (assoc.email) {
      const emailKey = assoc.email.toLowerCase().trim();
      emailLookup[emailKey] = assoc.id;
    }
  });

  console.log('   Lookup tables ready');
  console.log();

  // Step 4: Match coordinates to associations
  console.log('4. Matching coordinates to associations...');
  const coordsToInsert = [];
  let matched = 0;
  let unmatched = 0;

  coordRecords.forEach((coord, idx) => {
    const name = (coord.name || '').toLowerCase().trim();
    const lat = parseFloat(coord.lat);
    const lon = parseFloat(coord.lon);

    let assocId = null;

    // Try name match first (if name exists)
    if (name) {
      assocId = nameLookup[name];
    }

    // If no name match, try email match (from the coordinate record itself)
    // Note: coordRecords may have additional fields from the source CSV
    if (!assocId) {
      for (const email_col of ['EMAIL', 'email', 'Email', 'Email 2', 'email2']) {
        const email = (coord[email_col] || '').toLowerCase().trim();
        if (email && email.includes('@')) {
          assocId = emailLookup[email];
          if (assocId) break;
        }
      }
    }

    if (assocId && !isNaN(lat) && !isNaN(lon)) {
      coordsToInsert.push({
        association_id: assocId,
        lat: lat,
        lon: lon,
        source_file: coord.file || 'unknown',
      });
      matched++;
    } else {
      unmatched++;
    }
  });

  console.log(`   Matched: ${matched} coordinates`);
  console.log(`   Unmatched: ${unmatched} coordinates`);
  console.log();

  // Step 5: Insert coordinates in batches
  console.log('5. Inserting coordinates into database...');
  const BATCH_SIZE = 50;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < coordsToInsert.length; i += BATCH_SIZE) {
    const batch = coordsToInsert.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(coordsToInsert.length / BATCH_SIZE);

    try {
      const { error } = await supabase
        .from('association_coordinates')
        .insert(batch);

      if (error) {
        console.error(`   ERROR Batch ${batchNum}/${totalBatches}: ${error.message}`);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        const progress = Math.min(successCount + errorCount, coordsToInsert.length);
        const percent = Math.round((progress / coordsToInsert.length) * 100);
        console.log(
          `   ✓ Batch ${batchNum}/${totalBatches} (${progress}/${coordsToInsert.length} coords, ${percent}%)`
        );
      }
    } catch (err) {
      console.error(`   ERROR Batch ${batchNum}/${totalBatches}: ${err.message}`);
      errorCount += batch.length;
    }
  }

  console.log();
  console.log('========================================');
  console.log('PHASE 5 COMPLETE');
  console.log('========================================');
  console.log(`✓ Successfully imported: ${successCount} coordinates`);
  if (errorCount > 0) {
    console.log(`✗ Failed: ${errorCount} coordinates`);
  }
  console.log();
  console.log('SUMMARY:');
  console.log(`  Coordinates in file: ${coordRecords.length}`);
  console.log(`  Matched to associations: ${matched}`);
  console.log(`  Unmatched: ${unmatched}`);
  console.log(`  Inserted successfully: ${successCount}`);
  console.log();
}

importCoordinates().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
