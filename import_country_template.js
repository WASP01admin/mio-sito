#!/usr/bin/env node

/**
 * UNIVERSAL COUNTRY IMPORT TEMPLATE
 *
 * COPY THIS FILE and customize ONLY the MARKED SECTIONS below.
 * Example: cp import_country_template.js import_canada.js
 * Then modify CONFIGURATION section with country-specific details.
 *
 * DO NOT change the import logic or validation rules.
 * All countries use the SAME process.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const {
  VALID_COUNTRIES,
  parseCSV,
  normalizeRecords,
  validateRecord,
  exportCSV,
  generateAuditReport
} = require('./lib/association_import_utils');

require('dotenv').config();

// ═══════════════════════════════════════════════════════════════════════════
// ⚙️  CONFIGURATION - CUSTOMIZE FOR EACH COUNTRY
// ═══════════════════════════════════════════════════════════════════════════

const COUNTRY_CONFIG = {
  // REQUIRED: Country name (must match IMPORT_SCHEMA.md list)
  countryName: 'COUNTRY_NAME_HERE',

  // REQUIRED: Path to source CSV file
  sourceCSVPath: './path/to/country_data.csv',

  // OPTIONAL: Column mapping if CSV column names don't match standards
  // Format: { "Source Column Name": "target_field_name" }
  // Leave empty {} if column names are already standard (code, name, city, etc.)
  columnMapping: {
    // Example for Canada:
    // "Association Code": "code",
    // "Full Name": "name",
    // "City/Town": "city",
    // "Street Address": "address",
    // Leave out if already matching!
  },

  // OPTIONAL: Preprocessing function to clean raw records
  // Return modified records array
  preprocessRecords: null, // (records) => { ... return records; }
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION - DO NOT MODIFY
// ═══════════════════════════════════════════════════════════════════════════

function validateConfig() {
  if (!COUNTRY_CONFIG.countryName || COUNTRY_CONFIG.countryName === 'COUNTRY_NAME_HERE') {
    throw new Error('ERROR: Set COUNTRY_CONFIG.countryName before running');
  }
  if (!VALID_COUNTRIES.includes(COUNTRY_CONFIG.countryName)) {
    throw new Error(`ERROR: Invalid country "${COUNTRY_CONFIG.countryName}". Valid options:\n  ${VALID_COUNTRIES.join('\n  ')}`);
  }
  if (!COUNTRY_CONFIG.sourceCSVPath || !fs.existsSync(COUNTRY_CONFIG.sourceCSVPath)) {
    throw new Error(`ERROR: Source CSV not found: ${COUNTRY_CONFIG.sourceCSVPath}`);
  }
  console.log(`✓ Configuration valid for: ${COUNTRY_CONFIG.countryName}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT LOGIC - UNIVERSAL, DO NOT MODIFY
// ═══════════════════════════════════════════════════════════════════════════

async function importCountry() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log(`║  IMPORT: ${COUNTRY_CONFIG.countryName.toUpperCase().padEnd(33)}║`);
  console.log('║  Using UNIVERSAL import logic              ║');
  console.log('╚═══════════════════════════════════════════╝');

  // Validate config
  validateConfig();

  // Step 1: Parse CSV
  let { records } = parseCSV(COUNTRY_CONFIG.sourceCSVPath);

  // Step 2: Preprocess if needed
  if (COUNTRY_CONFIG.preprocessRecords) {
    console.log('\nApplying custom preprocessing...');
    records = COUNTRY_CONFIG.preprocessRecords(records);
    console.log(`  ✓ Preprocessing complete: ${records.length} records`);
  }

  // Step 3: Normalize to schema
  const { normalized, errors: normalizationErrors } = normalizeRecords(
    records,
    COUNTRY_CONFIG.columnMapping,
    COUNTRY_CONFIG.countryName
  );

  // Step 4: Data quality checks
  console.log('\nValidating data quality...');
  const validationWarnings = [];
  let withCoords = 0;
  let withEmail = 0;
  let withWebsite = 0;

  normalized.forEach((record, idx) => {
    const issues = validateRecord(record);
    if (issues.length > 0) {
      validationWarnings.push({
        code: record.code,
        issues: issues
      });
    }
    if (record.lat && record.lng) withCoords++;
    if (record.email) withEmail++;
    if (record.website) withWebsite++;
  });

  console.log(`  ✓ Checked ${normalized.length} records`);
  if (validationWarnings.length > 0) {
    console.log(`    ⚠️  ${validationWarnings.length} records have quality warnings (see audit)`);
  }

  // Step 5: Check for duplicates
  console.log('\nChecking for duplicates...');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  const { data: existingCodes } = await supabase
    .from('associations')
    .select('code', { head: true })
    .eq('country', COUNTRY_CONFIG.countryName);

  const existingSet = new Set(existingCodes?.map(r => r.code) || []);
  const duplicates = normalized.filter(r => existingSet.has(r.code));
  const toInsert = normalized.filter(r => !existingSet.has(r.code));

  console.log(`  ✓ Found ${duplicates.length} duplicates (will skip)`);
  console.log(`  ✓ Ready to insert ${toInsert.length} new records`);

  // Step 6: Batch insert
  if (toInsert.length === 0) {
    console.log('\n⚠️  No new records to insert');
  } else {
    console.log(`\nInserting ${toInsert.length} records in batches of 100...`);
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);
      const { error } = await supabase
        .from('associations')
        .insert(batch);

      if (error) {
        console.error(`  ✗ Batch ${Math.floor(i / batchSize) + 1} FAILED:`, error.message);
        throw error;
      }

      inserted += batch.length;
      const progress = Math.min(inserted, toInsert.length);
      console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records (total: ${progress}/${toInsert.length})`);
    }

    console.log(`\n✓ Successfully inserted ${inserted} records`);
  }

  // Step 7: Export normalized CSV for verification
  const exportPath = path.join(
    path.dirname(COUNTRY_CONFIG.sourceCSVPath),
    `${COUNTRY_CONFIG.countryName.toLowerCase().replace(/\s+/g, '_')}_associations_normalized.csv`
  );
  exportCSV(normalized, exportPath);

  // Step 8: Generate audit report
  const auditPath = path.join(
    path.dirname(COUNTRY_CONFIG.sourceCSVPath),
    `${COUNTRY_CONFIG.countryName.toLowerCase().replace(/\s+/g, '_')}_import_audit.log`
  );

  generateAuditReport({
    country: COUNTRY_CONFIG.countryName,
    sourceFile: COUNTRY_CONFIG.sourceCSVPath,
    totalRecords: records.length,
    validRecords: normalized.length,
    skippedMissing: normalizationErrors.length,
    validationWarnings: validationWarnings.length,
    withCoordinates: withCoords,
    withoutCoordinates: normalized.length - withCoords,
    withEmail: withEmail,
    withWebsite: withWebsite,
    inserted: toInsert.length,
    duplicates: duplicates.length,
    errors: normalizationErrors.concat(validationWarnings.map(w => ({
      row: 0,
      reason: `Code ${w.code}: ${w.issues.join('; ')}`
    })))
  }, auditPath);

  // Step 9: Final summary
  console.log(`\n╔═══════════════════════════════════════════╗`);
  console.log(`║  IMPORT COMPLETE                          ║`);
  console.log(`╚═══════════════════════════════════════════╝\n`);
  console.log(`Country: ${COUNTRY_CONFIG.countryName}`);
  console.log(`Records inserted: ${toInsert.length}`);
  console.log(`Records with coordinates: ${withCoords}/${normalized.length}`);
  console.log(`Records with email: ${withEmail}/${normalized.length}`);
  console.log(`\nFiles generated:`);
  console.log(`  • Normalized CSV: ${exportPath}`);
  console.log(`  • Audit report: ${auditPath}`);
  console.log(`\nVerify the data before using in production!\n`);
}

importCountry().catch(err => {
  console.error('\n✗ ERROR:', err.message);
  process.exit(1);
});
