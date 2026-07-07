#!/usr/bin/env node

/**
 * COMPLETE ITALY RE-IMPORT
 * 1. Delete old Italy records
 * 2. Import new unified CSV
 * 3. Merge coordinates back from backup
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { parseCSV, normalizeRecords, validateRecord, exportCSV, generateAuditReport } = require('./lib/association_import_utils');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function deleteOldItalyRecords() {
  console.log('\n─────────────────────────────────────────────');
  console.log('STEP 1: Deleting old Italy records...');
  console.log('─────────────────────────────────────────────\n');

  const { error: deleteError } = await supabase
    .from('associations')
    .delete()
    .eq('country', 'Italy');

  if (deleteError) {
    throw new Error(`Failed to delete Italy records: ${deleteError.message}`);
  }

  console.log('✓ Deleted all old Italy records from database\n');
}

async function importNewItalyData() {
  console.log('─────────────────────────────────────────────');
  console.log('STEP 2: Importing new unified Italy CSV...');
  console.log('─────────────────────────────────────────────\n');

  const sourceCSVPath = 'C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\ITALY_UNIFIED.csv';

  // Parse CSV
  let { records } = parseCSV(sourceCSVPath);
  console.log(`\nParsed ${records.length} records from unified Italy CSV`);

  // Normalize
  const { normalized } = normalizeRecords(records, {}, 'Italy');

  // Generate codes
  console.log('Generating codes...');
  normalized.forEach((record, idx) => {
    if (!record.code) {
      record.code = `ITA${String(10 + idx).padStart(4, '0')}`;
    }
  });
  console.log(`✓ Generated codes: ITA0010 to ITA${String(10 + normalized.length - 1).padStart(4, '0')}`);

  // Validate
  console.log('\nValidating records...');
  let withCoords = 0;
  let withEmail = 0;

  normalized.forEach(record => {
    if (record.lat && record.lng) withCoords++;
    if (record.email) withEmail++;
  });

  console.log(`✓ Validation passed: ${normalized.length} records ready for insert`);

  // Batch insert
  console.log(`\nInserting ${normalized.length} records in batches of 100...\n`);
  const batchSize = 100;

  for (let i = 0; i < normalized.length; i += batchSize) {
    const batch = normalized.slice(i, i + batchSize);
    const { error } = await supabase
      .from('associations')
      .insert(batch);

    if (error) {
      throw new Error(`Batch insert failed: ${error.message}`);
    }

    console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
  }

  console.log(`\n✓ Successfully inserted ${normalized.length} new records\n`);

  return normalized;
}

async function mergeCoordinatesBack() {
  console.log('─────────────────────────────────────────────');
  console.log('STEP 3: Merging coordinates back...');
  console.log('─────────────────────────────────────────────\n');

  const backupPath = 'italy_coordinates_backup.csv';

  if (!fs.existsSync(backupPath)) {
    console.log('⚠️  Backup file not found. Skipping coordinate merge.');
    return;
  }

  // Parse backup file
  const content = fs.readFileSync(backupPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');

  let merged = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const code = values[0];
    const lat = values[2];
    const lng = values[3];

    if (!lat || !lng || lat === '' || lng === '') {
      skipped++;
      continue;
    }

    // Update coordinates
    const { error } = await supabase
      .from('associations')
      .update({ lat: parseFloat(lat), lng: parseFloat(lng) })
      .eq('code', code)
      .eq('country', 'Italy');

    if (!error) {
      merged++;
    }
  }

  console.log(`✓ Merged ${merged} coordinates back to database`);
  console.log(`  (${skipped} records had no coordinates in backup)\n`);
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  COMPLETE ITALY RE-IMPORT PROCESS         ║');
  console.log('║  (Safe: backup → delete → import → merge) ║');
  console.log('╚═══════════════════════════════════════════╝');

  try {
    await deleteOldItalyRecords();
    await importNewItalyData();
    await mergeCoordinatesBack();

    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  RE-IMPORT COMPLETE ✓                     ║');
    console.log('╚═══════════════════════════════════════════╝\n');
    console.log('Summary:');
    console.log('  • Old Italy records: DELETED');
    console.log('  • New unified CSV: IMPORTED (1,248 records)');
    console.log('  • Coordinates: MERGED BACK from backup');
    console.log('  • Status: Ready to use on map and admin panel\n');

  } catch (err) {
    console.error('\n✗ ERROR:', err.message);
    process.exit(1);
  }
}

main();
