#!/usr/bin/env node

/**
 * IMPORT AUSTRALIA ASSOCIATIONS
 * Using standardized 14-column format
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ═══════════════════════════════════════════════════════════════════════════
// ⚙️  CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const COUNTRY_CONFIG = {
  countryName: 'Australia',
  sourceCSVPath: 'C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\AUSTRALIA.csv',

  // Column mapping
  columnMapping: {
    'NAME': 'name',
    'ADDRESS': 'address',
    'WEBSITE': 'website',
    'EMAIL': 'email',
    'LAT': 'lat',
    'LON': 'lng',
    'PHONE': 'phone',
    'FACEBOOK': 'facebook_url',
    'INSTAGRAM': 'instagram',
  },

  preprocessRecords: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT LOGIC (Universal, DO NOT MODIFY)
// ═══════════════════════════════════════════════════════════════════════════

const { parseCSV, normalizeRecords, validateRecord, exportCSV, generateAuditReport } = require('./lib/association_import_utils');

async function importAustralia() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log(`║  IMPORT: ${COUNTRY_CONFIG.countryName.toUpperCase().padEnd(28)}║`);
  console.log('║  Using UNIVERSAL import logic              ║');
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
  console.log(`Parsed ${records.length} records from Australia CSV\n`);

  // Normalize to schema
  const { normalized, errors: normalizationErrors } = normalizeRecords(
    records,
    COUNTRY_CONFIG.columnMapping,
    COUNTRY_CONFIG.countryName
  );

  // Clean up invalid coordinates
  console.log('Cleaning up coordinates...');
  let invalidCoords = 0;
  normalized.forEach((record) => {
    if (record.lat || record.lng) {
      const latStr = String(record.lat || '');
      const lngStr = String(record.lng || '');

      if (latStr.includes('°') || latStr.includes("'") || latStr.includes('E') || latStr.includes('N') ||
          lngStr.includes('°') || lngStr.includes("'") || lngStr.includes('E') || lngStr.includes('W')) {
        record.lat = null;
        record.lng = null;
        invalidCoords++;
      }
    }
  });
  if (invalidCoords > 0) {
    console.log(`✓ Cleaned up ${invalidCoords} records with invalid coordinate formats\n`);
  }

  // Generate codes (starting from AUS0010)
  console.log('Generating codes...');
  normalized.forEach((record, idx) => {
    if (!record.code) {
      record.code = `AUS${String(10 + idx).padStart(4, '0')}`;
    }
  });
  console.log(`✓ Generated codes: AUS0010 to AUS${String(10 + normalized.length - 1).padStart(4, '0')}\n`);

  // Data quality checks
  console.log('Validating data quality...');
  const validationWarnings = [];
  let withCoords = 0;
  let withEmail = 0;
  let withWebsite = 0;

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
  });

  console.log(`✓ Checked ${normalized.length} records`);
  if (validationWarnings.length > 0) {
    console.log(`  ⚠️  ${validationWarnings.length} records have quality warnings\n`);
  } else {
    console.log('  ✓ All records passed validation\n');
  }

  // Check for duplicates
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
  const exportPath = `australia_associations_normalized.csv`;
  exportCSV(normalized, exportPath);

  // Generate audit report
  const auditPath = `australia_import_audit.log`;
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
  console.log(`Records with website: ${withWebsite}/${normalized.length} (${Math.round(withWebsite / normalized.length * 100)}%)\n`);
  console.log(`Files generated:`);
  console.log(`  • Normalized CSV: ${exportPath}`);
  console.log(`  • Audit report: ${auditPath}\n`);
}

importAustralia().catch(err => {
  console.error('\n✗ ERROR:', err.message);
  process.exit(1);
});
