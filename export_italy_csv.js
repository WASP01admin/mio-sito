#!/usr/bin/env node

/**
 * EXPORT ITALY ASSOCIATIONS TO CSV
 * Gets all records with country='Italy' (includes PIEMONTE)
 * Handles pagination to fetch all 1000+ records
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function exportItaly() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  EXPORT ITALY ASSOCIATIONS TO CSV         ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  let allRecords = [];
  let offset = 0;
  const pageSize = 1000;

  console.log('Fetching all Italy records...\n');

  while (true) {
    const { data, error } = await supabase
      .from('associations')
      .select('*')
      .eq('country', 'Italy')
      .order('code', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching data:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      break;
    }

    console.log(`  Fetch ${Math.floor(offset / pageSize) + 1}: got ${data.length} records`);
    allRecords = allRecords.concat(data);

    if (data.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  console.log(`\nTotal Italy records: ${allRecords.length}\n`);

  // Build CSV
  if (allRecords.length === 0) {
    console.log('⚠️  No records found!\n');
    process.exit(0);
  }

  const headers = Object.keys(allRecords[0]);
  const csvLines = [headers.join(',')];

  allRecords.forEach(row => {
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

  const csv = csvLines.join('\n');
  const filename = 'italy_associations_export.csv';
  fs.writeFileSync(filename, csv);

  console.log(`✓ Exported to: ${filename}`);
  console.log(`  Records: ${allRecords.length}`);
  console.log(`  With coordinates: ${allRecords.filter(r => r.lat && r.lng).length}`);
  console.log(`  Missing coordinates: ${allRecords.filter(r => !r.lat || !r.lng).length}\n`);
}

exportItaly().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
