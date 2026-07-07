#!/usr/bin/env node

/**
 * IMPORT ITALY ASSOCIATIONS (UNIFIED)
 * Merged from ITA.csv + ITA - PIEMONTE.csv
 * Using the standardized 14-column format
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ═══════════════════════════════════════════════════════════════════════════
// ⚙️  CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const COUNTRY_CONFIG = {
  countryName: 'Italy',
  sourceCSVPath: 'C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\ITALY_UNIFIED.csv',

  // Column mapping (source CSV → standard schema)
  // The ITALY_UNIFIED.csv already uses standard names, so minimal mapping needed
  columnMapping: {
    'name': 'name',
    'address': 'address',
    'city': 'city',
    'postal_code': 'postal_code',
    'email': 'email',
    'email_secondary': 'email_secondary',
    'phone': 'phone',
    'website': 'website',
    'lat': 'lat',
    'lng': 'lng',
    'facebook_url': 'facebook_url',
    'instagram': 'instagram',
    'contact_person': 'contact_person',
    'extra_details': 'extra_details',
  },

  // No preprocessing needed - CSV is already standardized
  preprocessRecords: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT LOGIC (Universal, DO NOT MODIFY)
// ═══════════════════════════════════════════════════════════════════════════

const { parseCSV, normalizeRecords, validateRecord, exportCSV, generateAuditReport } = require('./lib/association_import_utils');

async function importItaly() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log(`║  IMPORT: ${COUNTRY_CONFIG.countryName.toUpperCase().padEnd(32)}║`);
  console.log('║  Using UNIVERSAL import logic              ║');
  console.log('║  (Merged: ITA.csv + ITA-PIEMONTE.csv)     ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Validate config
  if (!COUNTRY_CONFIG.countryName || !COUNTRY_CONFIG.sourceCSVPath) {
    console.error('ERROR: Missing configuration');
    process.exit(1);
  }

  if (!fs.existsSync(COUNTRY_CONFIG.sourceCSVPath)) {
    console.error(`ERROR: File not found: ${COUNTRY_CONFIG.sourceCSVPath}`);
    process.exit(1);
  }

  console.log(`Country: ${COUNTRY_CONFIG.countryName}`);
  console.log(`Source: ${COUNTRY_CONFIG.sourceCSVPath}\n`);

  // Parse CSV
  let { records } = parseCSV(COUNTRY_CONFIG.sourceCSVPath);
  console.log(`Parsed ${records.length} records from unified Italy CSV\n`);

  // Normalize to schema
  const { normalized, errors: normalizationErrors } = normalizeRecords(
    records,
    COUNTRY_CONFIG.columnMapping,
    COUNTRY_CONFIG.countryName
  );

  // Generate codes for records without them (starting from ITA0010)
  console.log('Generating codes...');
  normalized.forEach((record, idx) => {
    if (!record.code) {
      record.code = `ITA${String(10 + idx).padStart(4, '0')}`;
    }
  });
  console.log(`✓ Generated codes: ITA0010 to ITA${String(10 + normalized.length - 1).padStart(4, '0')}\n`);

  // Data quality checks
  console.log('Validating data quality...');
  const validationWarnings = [];
  let withCoords = 0;
  let withEmail = 0;
  let withWebsite = 0;
  let withCity = 0;

  normalized.forEach((record) => {
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
    if (record.city) withCity++;
  });

  console.log(`✓ Checked ${normalized.length} records`);
  if (validationWarnings.length > 0) {
    console.log(`  ⚠️  ${validationWarnings.length} records have quality warnings\n`);
  } else {
    console.log('  ✓ All records passed validation\n');
  }

  // Check for duplicates (comparing with existing Italy records)
  console.log('Checking for duplicates...');
  const { data: existingCodes } = await supabase
    .from('associations')
    .select('code')
    .eq('country', COUNTRY_CONFIG.countryName);

  const existingSet = new Set(existingCodes?.map(r => r.code) || []);
  const duplicates = normalized.filter(r => existingSet.has(r.code));
  const toInsert = normalized.filter(r => !existingSet.has(r.code));

  console.log(`✓ Found ${duplicates.length} duplicates (will skip)`);
  console.log(`✓ Ready to insert ${toInsert.length} new records\n`);

  // Batch insert
  if (toInsert.length === 0) {
    console.log('⚠️  No new records to insert\n');
    process.exit(0);
  }

  console.log(`Inserting ${toInsert.length} records in batches of 100...\n`);
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { error } = await supabase
      .from('associations')
      .insert(batch);

    if (error) {
      console.error(`✗ Batch ${Math.floor(i / batchSize) + 1} FAILED:`, error.message);
      throw error;
    }

    inserted += batch.length;
    const progress = Math.min(inserted, toInsert.length);
    console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records (total: ${progress}/${toInsert.length})`);
  }

  console.log(`\n✓ Successfully inserted ${inserted} records\n`);

  // Export normalized CSV for verification
  const exportPath = `italy_associations_normalized.csv`;
  exportCSV(normalized, exportPath);

  // Generate audit report
  const auditPath = `italy_import_audit.log`;
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
    errors: normalizationErrors
  }, auditPath);

  // Final summary
  console.log(`╔═══════════════════════════════════════════╗`);
  console.log(`║  IMPORT COMPLETE ✓                        ║`);
  console.log(`╚═══════════════════════════════════════════╝\n`);
  console.log(`Country: ${COUNTRY_CONFIG.countryName}`);
  console.log(`Records inserted: ${toInsert.length}`);
  console.log(`Records with coordinates: ${withCoords}/${normalized.length} (${Math.round(withCoords / normalized.length * 100)}%)`);
  console.log(`Records with email: ${withEmail}/${normalized.length} (${Math.round(withEmail / normalized.length * 100)}%)`);
  console.log(`Records with website: ${withWebsite}/${normalized.length} (${Math.round(withWebsite / normalized.length * 100)}%)`);
  console.log(`Records with city: ${withCity}/${normalized.length} (${Math.round(withCity / normalized.length * 100)}%)\n`);
  console.log(`Files generated:`);
  console.log(`  • Normalized CSV: ${exportPath}`);
  console.log(`  • Audit report: ${auditPath}\n`);
}

importItaly().catch(err => {
  console.error('\n✗ ERROR:', err.message);
  process.exit(1);
});
