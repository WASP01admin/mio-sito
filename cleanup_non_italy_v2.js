#!/usr/bin/env node

/**
 * CLEANUP: DELETE ALL NON-ITALY ASSOCIATIONS (BATCH VERSION)
 * Keep only: Italy (ITA0001-ITA0955) + PIEMONTE (ITA0956-ITA1248)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanupNonItaly() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  CLEANUP: DELETE NON-ITALY (BATCH)     ║');
  console.log('║  Keep only Italy + PIEMONTE            ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Get all non-Italy associations
  console.log('1. Fetching non-Italy associations...');
  const { data: nonItaly, error: fetchError } = await supabase
    .from('associations')
    .select('id, code, country');

  if (fetchError) {
    console.error('Error fetching:', fetchError);
    process.exit(1);
  }

  // Filter to non-Italy only
  const nonItalyRecords = nonItaly?.filter(r => r.country !== 'Italy') || [];
  console.log(`   Found ${nonItalyRecords.length} non-Italy associations\n`);

  if (nonItalyRecords.length === 0) {
    console.log('✓ Database is clean!\n');
    process.exit(0);
  }

  // Group by country for visibility
  const byCountry = new Map();
  nonItalyRecords.forEach(row => {
    if (!byCountry.has(row.country)) {
      byCountry.set(row.country, []);
    }
    byCountry.get(row.country).push(row.id);
  });

  console.log('2. Countries to delete:');
  byCountry.forEach((ids, country) => {
    console.log(`   - ${country}: ${ids.length}`);
  });
  console.log();

  // Delete in batches
  console.log('3. Deleting in batches of 100...');
  const batchSize = 100;
  let deleted = 0;

  for (let i = 0; i < nonItalyRecords.length; i += batchSize) {
    const batch = nonItalyRecords.slice(i, i + batchSize);
    const batchIds = batch.map(r => r.id);

    const { error: deleteError } = await supabase
      .from('associations')
      .delete()
      .in('id', batchIds);

    if (deleteError) {
      console.error(`   ✗ Batch ${Math.floor(i / batchSize) + 1} failed:`, deleteError);
      process.exit(1);
    }

    deleted += batchIds.length;
    process.stdout.write(`\r   Deleted: ${deleted}/${nonItalyRecords.length}`);
  }

  console.log('\n\n4. Verifying final state...');
  const { data: remaining } = await supabase
    .from('associations')
    .select('id, code, country');

  const countByCountry = new Map();
  remaining?.forEach(row => {
    const country = row.country || 'NULL';
    countByCountry.set(country, (countByCountry.get(country) ?? 0) + 1);
  });

  console.log('\n   Remaining associations:');
  countByCountry.forEach((count, country) => {
    console.log(`   - ${country}: ${count}`);
  });

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         CLEANUP COMPLETE!              ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✓ Deleted: ${deleted} non-Italy associations`);
  console.log(`✓ Remaining: ${remaining?.length || 0} (Italy only)\n`);
}

cleanupNonItaly().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
