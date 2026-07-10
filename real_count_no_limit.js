#!/usr/bin/env node

/**
 * GET REAL COUNT - NO LIMITS
 * Fetch ALL records without 1000 limit
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function getRealCount() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  GET REAL COUNT - NO 1000 LIMIT           ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  console.log('Fetching ALL records (no pagination limit)...\n');

  // Fetch in large chunks to bypass 1000 limit
  let allRecords = [];
  let offset = 0;
  const pageSize = 5000;

  while (true) {
    const { data, error } = await supabase
      .from('associations')
      .select('id, code, country')
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) break;

    allRecords = [...allRecords, ...data];
    console.log(`  Fetched: ${allRecords.length} records...`);

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  console.log(`\n✓ Total records fetched: ${allRecords.length}\n`);

  // Count by country
  const byCountry = new Map();
  allRecords.forEach(r => {
    const c = r.country || 'NULL';
    byCountry.set(c, (byCountry.get(c) ?? 0) + 1);
  });

  console.log('Breakdown by country:');
  console.log('━'.repeat(40));
  Array.from(byCountry.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, count]) => {
      console.log(`${country.padEnd(25)} : ${count}`);
    });

  const italyCount = byCountry.get('Italy') || 0;
  const nonItalyCount = allRecords.length - italyCount;

  console.log('━'.repeat(40));
  console.log(`\nTotal: ${allRecords.length}`);
  console.log(`Italy: ${italyCount}`);
  console.log(`Non-Italy: ${nonItalyCount}\n`);

  // Sample non-Italy codes
  if (nonItalyCount > 0) {
    const nonItaly = allRecords.filter(r => r.country !== 'Italy');
    console.log('Sample non-Italy codes:');
    nonItaly.slice(0, 20).forEach(r => {
      console.log(`  ${r.code} (${r.country})`);
    });
    if (nonItaly.length > 20) {
      console.log(`  ... and ${nonItaly.length - 20} more`);
    }
  }
}

getRealCount().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
