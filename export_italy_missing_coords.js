#!/usr/bin/env node

/**
 * EXPORT ITALY ASSOCIATIONS WITHOUT COORDINATES
 * All columns preserved - filtered by missing LAT/LON only
 * EXCLUDES PIEMONTE (ITA0956+)
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function escapeCSV(value) {
  if (!value) return '';
  value = String(value);
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function exportItalyNoCoordsFull() {
  console.log('Fetching Italian associations without coordinates (excluding PIEMONTE)...\n');

  // Get all columns for Italian records without coords (excluding PIEMONTE)
  const { data: records, error } = await supabase
    .from('associations')
    .select('*')
    .eq('country', 'Italy')
    .lt('code', 'ITA0956')
    .is('lat', null);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Found ${records?.length || 0} Italian associations without coordinates\n`);

  if (!records || records.length === 0) {
    console.log('✓ All Italian associations have coordinates!');
    process.exit(0);
  }

  // Get all column names from the records
  const allColumns = records.length > 0 ? Object.keys(records[0]) : [];

  // Create CSV with ALL columns
  const lines = [allColumns.map(h => escapeCSV(h)).join(',')];

  records.forEach(rec => {
    const row = allColumns.map(col => rec[col] || '');
    lines.push(row.map(v => escapeCSV(v)).join(','));
  });

  const outputFile = `C:\\Users\\robbu\\Downloads\\ITALY_MISSING_COORDS_${records.length}.csv`;
  fs.writeFileSync(outputFile, lines.join('\n'), 'utf8');

  console.log(`✓ Exported to: ${outputFile}`);
  console.log(`✓ Records: ${records.length}`);
  console.log(`✓ Columns: ${allColumns.length}`);
  console.log(`\nColumns included:\n  ${allColumns.join(', ')}\n`);
}

exportItalyNoCoordsFull().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
