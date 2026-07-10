#!/usr/bin/env node

/**
 * Identify records that failed to import
 * Compares master_merged_all.csv against what's actually in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CSV_FILE = './metadata/master_merged_all.csv';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exportFailedRecords() {
  console.log('========================================');
  console.log('FINDING FAILED/MISSING RECORDS');
  console.log('========================================');
  console.log();

  // Step 1: Read CSV
  console.log('1. Reading source CSV...');
  const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });
  console.log(`   Loaded ${records.length} records from CSV`);
  console.log();

  // Step 2: Get all records from database
  console.log('2. Fetching records from Supabase...');
  const { data: dbRecords, error: dbError } = await supabase
    .from('associations')
    .select('name, email, code')
    .limit(10000);

  if (dbError) {
    console.error(`ERROR: ${dbError.message}`);
    process.exit(1);
  }

  console.log(`   Found ${dbRecords.length} records in database`);
  console.log();

  // Step 3: Create lookup set of database records (by name + email combo)
  const dbLookup = new Set();
  dbRecords.forEach(rec => {
    // Use name as primary key, add email as secondary
    if (rec.name) {
      dbLookup.add(rec.name.toLowerCase().trim());
    }
  });

  console.log(`3. Comparing CSV vs Database...`);
  const failedRecords = [];
  const importedRecords = [];

  records.forEach((row, idx) => {
    const name = (row.name || '').toLowerCase().trim();
    const email = (row.email || '').trim();

    if (dbLookup.has(name)) {
      importedRecords.push(row);
    } else {
      failedRecords.push({
        ...row,
        _reason: 'Not found in database',
      });
    }
  });

  console.log(`   Successfully imported: ${importedRecords.length}`);
  console.log(`   Failed/Missing: ${failedRecords.length}`);
  console.log();

  // Step 4: Export failed records
  if (failedRecords.length > 0) {
    console.log('4. Exporting failed records...');
    const failedFile = './metadata/failed_records_for_review.csv';

    const header = Object.keys(failedRecords[0]).join(',');
    const rows = failedRecords.map(rec => {
      return Object.values(rec)
        .map(v => {
          if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) {
            return `"${v.replace(/"/g, '""')}"`;
          }
          return v || '';
        })
        .join(',');
    });

    const csv = [header, ...rows].join('\n');
    fs.writeFileSync(failedFile, csv, 'utf-8');

    console.log(`   Exported to: failed_records_for_review.csv`);
    console.log(`   Records: ${failedRecords.length}`);
    console.log();

    // Show sample
    console.log('Sample of failed records (first 5):');
    failedRecords.slice(0, 5).forEach((rec, idx) => {
      console.log(`  ${idx + 1}. Name: "${rec.name}" | Email: "${rec.email}" | Country: "${rec.country}"`);
    });
  }

  console.log();
  console.log('========================================');
  console.log('DONE!');
  console.log('========================================');
}

exportFailedRecords().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
