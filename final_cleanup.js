#!/usr/bin/env node

/**
 * FINAL CLEANUP: Check actual state then delete all non-Italy in one operation
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function finalCleanup() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  FINAL CLEANUP - DELETE ALL NON-ITALY     ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Get exact counts
  const { count: totalCount } = await supabase
    .from('associations')
    .select('*', { count: 'exact' });

  const { count: italyCount } = await supabase
    .from('associations')
    .select('*', { count: 'exact' })
    .eq('country', 'Italy');

  const nonItalyCount = (totalCount || 0) - (italyCount || 0);

  console.log(`Total in DB: ${totalCount}`);
  console.log(`Italy: ${italyCount}`);
  console.log(`Non-Italy: ${nonItalyCount}\n`);

  if (nonItalyCount === 0) {
    console.log('✓ Database is already clean!\n');
    process.exit(0);
  }

  console.log(`Deleting ${nonItalyCount} non-Italy records...\n`);

  // Get all non-Italy IDs
  const { data: allNonItaly, error: fetchError } = await supabase
    .from('associations')
    .select('id, country')
    .neq('country', 'Italy');

  if (fetchError) {
    console.error('Fetch error:', fetchError);
    process.exit(1);
  }

  // Group by country
  const byCountry = new Map();
  allNonItaly?.forEach(r => {
    if (!byCountry.has(r.country)) {
      byCountry.set(r.country, []);
    }
    byCountry.get(r.country).push(r.id);
  });

  console.log('Countries to delete:');
  byCountry.forEach((ids, country) => {
    console.log(`  ${country}: ${ids.length}`);
  });
  console.log();

  // Delete each country one by one for visibility
  let totalDeleted = 0;
  for (const [country, ids] of byCountry) {
    console.log(`Deleting ${country} (${ids.length})...`);

    const { error: delError } = await supabase
      .from('associations')
      .delete()
      .in('id', ids);

    if (delError) {
      console.log(`  ✗ Error: ${delError.message}`);
    } else {
      totalDeleted += ids.length;
      console.log(`  ✓ Deleted`);
    }
  }

  console.log(`\nTotal deleted: ${totalDeleted}\n`);

  // Final verification
  console.log('Verifying...');
  const { count: finalCount } = await supabase
    .from('associations')
    .select('*', { count: 'exact' });

  const { count: finalItaly } = await supabase
    .from('associations')
    .select('*', { count: 'exact' })
    .eq('country', 'Italy');

  console.log(`\nFinal state:`);
  console.log(`  Total: ${finalCount}`);
  console.log(`  Italy: ${finalItaly}`);
  console.log(`  Other: ${(finalCount || 0) - (finalItaly || 0)}\n`);

  if ((finalCount || 0) === (finalItaly || 0)) {
    console.log('✓✓✓ SUCCESS! Database contains only Italy.\n');
  }
}

finalCleanup().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
