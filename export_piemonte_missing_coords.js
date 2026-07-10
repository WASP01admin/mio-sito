#!/usr/bin/env node

/**
 * EXPORT PIEMONTE ASSOCIATIONS WITHOUT COORDINATES
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

async function exportPiemonteNoCoords() {
  console.log('Fetching PIEMONTE associations without coordinates...\n');

  const { data: records, error } = await supabase
    .from('associations')
    .select('code, name, address, city, email, phone, website, facebook_url')
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

  // Create CSV
  const headers = ['CODE', 'NAME', 'ADDRESS', 'CITY', 'EMAIL', 'PHONE', 'WEBSITE', 'FACEBOOK'];
  const lines = [headers.map(h => escapeCSV(h)).join(',')];

  records.forEach(rec => {
    const row = [
      rec.code || '',
      rec.name || '',
      rec.address || '',
      rec.city || '',
      rec.email || '',
      rec.phone || '',
      rec.website || '',
      rec.facebook_url || ''
    ];
    lines.push(row.map(v => escapeCSV(v)).join(','));
  });

  const outputFile = `C:\\Users\\robbu\\Downloads\\PIEMONTE_NO_COORDS_${records.length}.csv`;
  fs.writeFileSync(outputFile, lines.join('\n'), 'utf8');

  console.log(`✓ Exported to: ${outputFile}`);
  console.log(`✓ Records: ${records.length}`);
  console.log(`\nColumns: CODE, NAME, ADDRESS, CITY, EMAIL, PHONE, WEBSITE, FACEBOOK\n`);
}

exportPiemonteNoCoords().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
