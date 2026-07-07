#!/usr/bin/env node

/**
 * EXPORT ALL ASSOCIATIONS DATA
 * Create complete CSV backup of entire database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function exportAllAssociations() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  EXPORT ALL ASSOCIATIONS DATABASE         ║');
  console.log('║  Complete backup of 5,223 records         ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Fetch all associations with pagination
  const allRecords = [];
  let offset = 0;
  const pageSize = 1000;

  console.log('Fetching all associations from database...\n');

  while (true) {
    const { data, error } = await supabase
      .from('associations')
      .select('code, name, country, city, address, website, email, phone, lat, lng, instagram, email_secondary, postal_code, contact_person, extra_details')
      .range(offset, offset + pageSize - 1)
      .order('code');

    if (error) {
      console.error('Error:', error);
      break;
    }

    if (!data || data.length === 0) break;

    allRecords.push(...data);
    console.log(`  Fetched: ${allRecords.length} records`);

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  console.log(`\n✓ Total records exported: ${allRecords.length}\n`);

  // Create CSV header
  const headers = ['code', 'name', 'country', 'city', 'address', 'website', 'email', 'phone', 'lat', 'lng', 'instagram', 'email_secondary', 'postal_code', 'contact_person', 'extra_details'];

  // Create CSV rows with proper escaping
  const csvRows = allRecords.map(r => {
    return headers.map(h => {
      const value = r[h];
      if (value === null || value === undefined) {
        return '';
      }
      const strVal = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    }).join(',');
  });

  const csv = headers.join(',') + '\n' + csvRows.join('\n');

  // Write to file
  const filename = 'WASP_associations_complete_backup.csv';
  fs.writeFileSync(filename, csv);

  console.log(`✓ Exported CSV: ${filename}`);
  console.log(`  Records: ${allRecords.length}`);
  console.log(`  File size: ${(Buffer.byteLength(csv) / 1024 / 1024).toFixed(2)} MB\n`);

  // Count by country
  const byCountry = {};
  allRecords.forEach(r => {
    byCountry[r.country] = (byCountry[r.country] || 0) + 1;
  });

  console.log('Breakdown by country:');
  Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, count]) => {
      console.log(`  ${country.padEnd(20)} ${count}`);
    });

  console.log(`\n✓ Backup complete! File ready for backup to external drive.\n`);
}

exportAllAssociations().catch(err => {
  console.error('✗ ERROR:', err.message);
  process.exit(1);
});
