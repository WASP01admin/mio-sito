#!/usr/bin/env node

/**
 * BULK UPDATE ASSOCIATIONS
 * Updates lat/lng/email data from CSV for existing associations
 *
 * CSV format:
 * code,lat,lng,email,email_secondary
 * ITA0001,41.8719,12.5674,new@example.com,secondary@example.com
 * ITA0002,43.1234,11.4567,another@example.com,
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function bulkUpdate() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  BULK UPDATE ASSOCIATIONS                 ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Get CSV file path from command line or ask user
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.log('Usage: node update_associations_bulk.js <path-to-csv>');
    console.log('\nCSV format:');
    console.log('code,lat,lng,email,email_secondary');
    console.log('ITA0001,41.8719,12.5674,new@example.com,secondary@example.com');
    process.exit(0);
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: File not found: ${csvPath}`);
    process.exit(1);
  }

  // Parse CSV
  console.log(`Reading CSV: ${csvPath}\n`);
  const records = [];

  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(csvPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let isFirstLine = true;

    rl.on('line', (line) => {
      if (isFirstLine) {
        isFirstLine = false;
        return; // Skip header
      }

      const [code, lat, lng, email, email_secondary] = line.split(',').map(v => v.trim());

      if (!code) return; // Skip empty lines

      records.push({
        code,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        email: email || null,
        email_secondary: email_secondary || null
      });
    });

    rl.on('close', async () => {
      console.log(`Parsed ${records.length} records\n`);

      if (records.length === 0) {
        console.log('No records to update.');
        process.exit(0);
      }

      // Validate and update
      await processUpdates(records);
      resolve();
    });

    rl.on('error', reject);
  });
}

async function processUpdates(records) {
  console.log('Processing updates...\n');

  let updated = 0;
  let notFound = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Validate coordinates if present
    if ((record.lat || record.lng) && (!record.lat || !record.lng)) {
      errors.push(`Row ${i + 2}: Has one coordinate but missing the other (skipped)`);
      notFound++;
      continue;
    }

    if (record.lat) {
      if (isNaN(record.lat) || record.lat < -90 || record.lat > 90) {
        errors.push(`Row ${i + 2}: Invalid latitude ${record.lat} (skipped)`);
        notFound++;
        continue;
      }
    }

    if (record.lng) {
      if (isNaN(record.lng) || record.lng < -180 || record.lng > 180) {
        errors.push(`Row ${i + 2}: Invalid longitude ${record.lng} (skipped)`);
        notFound++;
        continue;
      }
    }

    // Find and update
    const { error } = await supabase
      .from('associations')
      .update({
        lat: record.lat,
        lng: record.lng,
        email: record.email,
        email_secondary: record.email_secondary
      })
      .eq('code', record.code);

    if (error) {
      errors.push(`Code ${record.code}: ${error.message}`);
      failed++;
    } else {
      updated++;
      if (updated % 10 === 0) {
        process.stdout.write(`\r  Updated: ${updated}/${records.length}`);
      }
    }
  }

  console.log(`\n\n╔═══════════════════════════════════════════╗`);
  console.log(`║  UPDATE COMPLETE                          ║`);
  console.log(`╚═══════════════════════════════════════════╝\n`);

  console.log(`Records updated: ${updated}`);
  console.log(`Not found/invalid: ${notFound}`);
  console.log(`Failed: ${failed}`);

  if (errors.length > 0) {
    console.log(`\nErrors/Warnings (${errors.length}):`);
    errors.forEach(e => console.log(`  ⚠️  ${e}`));
  }

  console.log();
}

bulkUpdate().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
