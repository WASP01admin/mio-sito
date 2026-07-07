#!/usr/bin/env node

/**
 * UNIVERSAL ASSOCIATION IMPORT UTILITY
 *
 * Used by all country imports to ensure consistent logic.
 * DO NOT MODIFY without updating IMPORT_SCHEMA.md
 */

const fs = require('fs');
const path = require('path');

// Valid countries (must match IMPORT_SCHEMA.md)
const VALID_COUNTRIES = [
  'Italy',
  'Canada',
  'United Kingdom',
  'United States',
  'Australia',
  'New Zealand',
  'Ireland'
];

/**
 * Normalize column name from source CSV to schema standard
 * E.g., "Association Name" → "name", "EMAIL ADDRESS" → "email"
 */
function normalizeColumnName(rawName, columnMapping = {}) {
  // Check if there's an explicit mapping
  if (columnMapping[rawName]) {
    return columnMapping[rawName];
  }

  // Auto-normalize common variations
  const normalized = rawName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  const nameMap = {
    'association_code': 'code',
    'code': 'code',
    'association_name': 'name',
    'name': 'name',
    'organisation_name': 'name',
    'organization_name': 'name',
    'organization name': 'name',
    'city': 'city',
    'town': 'city',
    'municipality': 'city',
    'suburb': 'city',
    'country': 'country',
    'address': 'address',
    'street_address': 'address',
    'street address': 'address',
    'postal_code': 'postal_code',
    'postcode': 'postal_code',
    'zip_code': 'postal_code',
    'postal code': 'postal_code',
    'latitude': 'lat',
    'lat': 'lat',
    'longitude': 'lng',
    'lng': 'lng',
    'phone': 'phone',
    'telephone': 'phone',
    'phone_number': 'phone',
    'phone number': 'phone',
    'telefono': 'phone',
    'email': 'email',
    'email_address': 'email',
    'email address': 'email',
    'e_mail': 'email',
    'email_secondary': 'email_secondary',
    'secondary_email': 'email_secondary',
    'email2': 'email_secondary',
    'email 2': 'email_secondary',
    'alternative_email': 'email_secondary',
    'website': 'website',
    'website_url': 'website',
    'url': 'website',
    'web': 'website',
    'homepage': 'website',
    'facebook': 'facebook_url',
    'facebook_url': 'facebook_url',
    'facebook_profile': 'facebook_url',
    'facebook url': 'facebook_url',
    'instagram': 'instagram',
    'instagram_url': 'instagram',
    'instagram_profile': 'instagram',
    'contact_person': 'contact_person',
    'contact': 'contact_person',
    'contact_name': 'contact_person',
    'contact name': 'contact_person',
    'primary_contact': 'contact_person',
    'extra_details': 'extra_details',
    'notes': 'extra_details',
    'description': 'extra_details',
    'extra details': 'extra_details',
    'notes_1': 'notes_1',
    'notes_2': 'notes_2',
    'instagram_url': 'instagram',
  };

  return nameMap[normalized] || null; // Return null if unrecognized
}

/**
 * Parse CSV with automatic encoding detection and proper quoted field handling
 */
function parseCSV(filePath) {
  console.log(`\nReading CSV: ${filePath}`);

  let content;
  try {
    // Try UTF-8 first
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    // Fall back to latin1
    console.log('  UTF-8 failed, trying latin1...');
    content = fs.readFileSync(filePath, 'latin1');
  }

  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || null;
    });
    records.push(record);
  }

  console.log(`  ✓ Parsed ${records.length} records`);
  return { headers, records };
}

/**
 * Parse a single CSV line, handling quoted fields with commas
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

/**
 * Normalize records to standard schema
 * @param records - Array of raw records from CSV
 * @param columnMapping - Optional: { "Source Column": "target_field" }
 * @param countryName - Country to assign to all records
 */
function normalizeRecords(records, columnMapping = {}, countryName) {
  console.log(`\nNormalizing ${records.length} records...`);

  if (!VALID_COUNTRIES.includes(countryName)) {
    throw new Error(`Invalid country: "${countryName}". Must be one of: ${VALID_COUNTRIES.join(', ')}`);
  }

  const normalized = [];
  const errors = [];

  records.forEach((record, idx) => {
    const normalized_record = { country: countryName };
    let missingRequired = [];

    // Map source columns to standard fields
    Object.entries(record).forEach(([sourceCol, value]) => {
      const targetField = normalizeColumnName(sourceCol, columnMapping);
      if (targetField) {
        normalized_record[targetField] = value;
      }
    });

    // Validate ONLY truly required field: NAME (code is generated, address/city are optional)
    const required = ['name'];
    required.forEach(field => {
      if (!normalized_record[field] || normalized_record[field].trim() === '') {
        missingRequired.push(field);
      }
    });

    // Default optional fields to empty string if missing
    if (!normalized_record.city) normalized_record.city = '';
    if (!normalized_record.address) normalized_record.address = '';

    if (missingRequired.length > 0) {
      errors.push({
        row: idx + 2, // +2 because CSV header is row 1, data starts at row 2
        record: normalized_record,
        reason: `Missing required fields: ${missingRequired.join(', ')}`
      });
    } else {
      // Clean up strings (trim whitespace)
      Object.keys(normalized_record).forEach(key => {
        if (typeof normalized_record[key] === 'string') {
          normalized_record[key] = normalized_record[key].trim();
        }
      });
      normalized.push(normalized_record);
    }
  });

  if (errors.length > 0) {
    console.log(`  ⚠️  ${errors.length} records have missing required fields (will be skipped)`);
  }

  console.log(`  ✓ Normalized ${normalized.length} valid records`);

  return { normalized, errors };
}

/**
 * Validate individual record data quality
 */
function validateRecord(record) {
  const issues = [];

  // Validate coordinates if present
  if (record.lat || record.lng) {
    if (!record.lat || !record.lng) {
      issues.push('Has one coordinate but missing the other');
    } else {
      const lat = parseFloat(record.lat);
      const lng = parseFloat(record.lng);
      if (isNaN(lat) || isNaN(lng)) {
        issues.push('Coordinates are not valid numbers');
      } else if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        issues.push('Coordinates out of valid range');
      }
    }
  }

  // Validate email if present
  if (record.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(record.email)) {
      issues.push(`Invalid email format: ${record.email}`);
    }
  }

  if (record.email_secondary) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(record.email_secondary)) {
      issues.push(`Invalid secondary email format: ${record.email_secondary}`);
    }
  }

  return issues;
}

/**
 * Generate CSV export from records (for verification)
 */
function exportCSV(records, outputPath) {
  if (records.length === 0) {
    console.log('No records to export');
    return;
  }

  const headers = Object.keys(records[0]);
  const csvLines = [headers.join(',')];

  records.forEach(row => {
    const values = headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) {
        return '';
      }
      const str = String(val);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvLines.push(values.join(','));
  });

  fs.writeFileSync(outputPath, csvLines.join('\n'));
  console.log(`\n✓ Exported normalized CSV: ${outputPath}`);
}

/**
 * Log audit report
 */
function generateAuditReport(auditData, outputPath) {
  const report = `
╔═══════════════════════════════════════════╗
║  IMPORT AUDIT REPORT                      ║
╚═══════════════════════════════════════════╝

Date: ${new Date().toISOString()}
Country: ${auditData.country}
Source File: ${auditData.sourceFile}

─────────────────────────────────────────────
STATISTICS
─────────────────────────────────────────────
Total records in CSV: ${auditData.totalRecords}
Records with required fields: ${auditData.validRecords}
Skipped (missing fields): ${auditData.skippedMissing}
Validation warnings: ${auditData.validationWarnings}

─────────────────────────────────────────────
DATA QUALITY
─────────────────────────────────────────────
Records with coordinates: ${auditData.withCoordinates}
Records without coordinates: ${auditData.withoutCoordinates}
Records with email: ${auditData.withEmail}
Records with website: ${auditData.withWebsite}

─────────────────────────────────────────────
IMPORT RESULT
─────────────────────────────────────────────
Records inserted: ${auditData.inserted}
Duplicates skipped: ${auditData.duplicates}

${auditData.errors.length > 0 ? `
─────────────────────────────────────────────
ERRORS & WARNINGS
─────────────────────────────────────────────
${auditData.errors.map(e => `• Row ${e.row}: ${e.reason}`).join('\n')}
` : ''}

Generated by: association_import_utils.js
`;

  fs.writeFileSync(outputPath, report);
  console.log(`✓ Audit report: ${outputPath}`);
}

module.exports = {
  VALID_COUNTRIES,
  normalizeColumnName,
  parseCSV,
  normalizeRecords,
  validateRecord,
  exportCSV,
  generateAuditReport
};
