#!/usr/bin/env node

/**
 * EXPORT PIEMONTE ASSOCIATIONS WITHOUT COORDINATES
 * All columns preserved - filtered by missing LAT/LON only
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

async function exportPiemonteNoCoordsFull() {
  console.log('Fetching PIEMONTE associations without coordinates...\n');

  // Get all columns for PIEMONTE records without coords
  const { data: records, error } = await supabase
    .from('associations')
    .select('*')
    .gte('code', 'ITA0956')
    .lte('code', 'ITA1248')
    .is('lat', null);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Found ${records?.length || 0} PIEMONTE associations without coordinates\n`);

  if (!records || records.length === 0) {
    console.log('✓ All PIEMONTE associations have coordinates!');
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

  const outputFile = `C:\\Users\\robbu\\Downloads\\PIEMONTE_MISSING_COORDS_${records.length}.csv`;
  fs.writeFileSync(outputFile, lines.join('\n'), 'utf8');

  console.log(`✓ Exported to: ${outputFile}`);
  console.log(`✓ Records: ${records.length}`);
  console.log(`✓ Columns: ${allColumns.length}`);
  console.log(`\nColumns included:\n  ${allColumns.join(', ')}\n`);
}

exportPiemonteNoCoordsFull().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
