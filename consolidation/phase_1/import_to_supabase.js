#!/usr/bin/env node

/**
 * WASP Association Import to Supabase
 *
 * Usage:
 * 1. Install dependencies: npm install @supabase/supabase-js csv-parse dotenv
 * 2. Set environment variables:
 *    export SUPABASE_URL="https://your-project.supabase.co"
 *    export SUPABASE_KEY="your-api-key-here"
 * 3. Run: node import_to_supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CSV_FILE = './metadata/master_merged_all.csv';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing environment variables');
  console.error('Set SUPABASE_URL and SUPABASE_KEY before running this script');
  console.error('Example:');
  console.error('  export SUPABASE_URL="https://xxx.supabase.co"');
  console.error('  export SUPABASE_KEY="your-api-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importAssociations() {
  console.log('========================================');
  console.log('WASP ASSOCIATION IMPORT TO SUPABASE');
  console.log('========================================');
  console.log();

  // Step 1: Read CSV
  console.log('1. Reading CSV file...');
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`ERROR: File not found: ${CSV_FILE}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`   Loaded ${records.length} records`);
  console.log();

  // Step 2: Generate codes and clean records
  console.log('2. Preparing records and generating codes...');

  // Map countries to 3-letter codes
  const countryCodeMap = {
    'italy': 'ITA', 'italia': 'ITA',
    'uk': 'GBR', 'united kingdom': 'GBR', 'england': 'GBR',
    'usa': 'USA', 'us': 'USA', 'united states': 'USA',
    'canada': 'CAN',
    'ireland': 'IRL',
    'australia': 'AUS',
    'new zealand': 'NZL', 'nz': 'NZL',
    'germany': 'DEU', 'deutschland': 'DEU',
    'netherlands': 'NLD',
    'romania': 'ROU',
    'south africa': 'ZAF',
  };

  function getCountryCode(countryStr) {
    if (!countryStr) return 'UNK';
    const country = countryStr.toLowerCase().trim();
    // Extract first 3 letters or look up in map
    for (const [key, code] of Object.entries(countryCodeMap)) {
      if (country.includes(key)) return code;
    }
    // Fallback: try to extract first word
    const firstWord = country.split(/[\s+]/)[0].substring(0, 3).toUpperCase();
    return firstWord.length === 3 ? firstWord : 'UNK';
  }

  // Track code sequences per country
  const codeCounts = {};

  const cleanRecords = records.map((row) => {
    const country = row.country || 'Unknown';
    const countryCode = getCountryCode(country);

    // Generate sequential code
    if (!codeCounts[countryCode]) {
      codeCounts[countryCode] = 0;
    }
    codeCounts[countryCode]++;
    const codeNum = String(codeCounts[countryCode]).padStart(4, '0');
    const code = `${countryCode}${codeNum}`;

    return {
      code: code,
      name: row.name || null,
      city: row.city || country || 'Unknown',  // Use country as fallback for city
      country: country || null,
      address: row.address || null,
      postal_code: row.postal_code || null,
      email: row.email || null,
      phone: row.phone || null,
      website: row.website || null,
    };
  });

  console.log('   Records cleaned, codes generated');
  console.log('   Country code distribution:');
  for (const [code, count] of Object.entries(codeCounts)) {
    console.log(`     ${code}: ${count} records`);
  }
  console.log();

  // Step 3: Insert in batches
  console.log('3. Importing to Supabase...');
  const BATCH_SIZE = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < cleanRecords.length; i += BATCH_SIZE) {
    const batch = cleanRecords.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(cleanRecords.length / BATCH_SIZE);

    try {
      const { data, error } = await supabase
        .from('associations')
        .insert(batch.map(r => ({
          code: r.code,
          name: r.name,
          city: r.city,
          country: r.country,
          address: r.address,
          postal_code: r.postal_code,
          email: r.email,
          phone: r.phone,
          website: r.website,
        })));

      if (error) {
        console.error(
          `   ERROR Batch ${batchNum}/${totalBatches}: ${error.message}`
        );
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        const progress = Math.min(successCount + errorCount, cleanRecords.length);
        const percent = Math.round((progress / cleanRecords.length) * 100);
        console.log(
          `   ✓ Batch ${batchNum}/${totalBatches} (${progress}/${cleanRecords.length} records, ${percent}%)`
        );
      }
    } catch (err) {
      console.error(`   ERROR Batch ${batchNum}/${totalBatches}: ${err.message}`);
      errorCount += batch.length;
    }
  }

  console.log();
  console.log('========================================');
  console.log('IMPORT COMPLETE');
  console.log('========================================');
  console.log(`✓ Successfully imported: ${successCount} records`);
  if (errorCount > 0) {
    console.log(`✗ Failed: ${errorCount} records`);
  }
  console.log();

  // Step 4: Verify
  console.log('4. Verifying import...');
  const { count, error: countError } = await supabase
    .from('associations')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error(`   ERROR: Could not verify: ${countError.message}`);
  } else {
    console.log(`   Total records in database: ${count}`);
  }

  console.log();
  console.log('DONE!');
}

importAssociations().catch((err) => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
