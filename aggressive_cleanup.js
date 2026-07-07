#!/usr/bin/env node

/**
 * AGGRESSIVE CLEANUP: Delete ALL non-Italy using direct RPC
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function aggressiveCleanup() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  AGGRESSIVE CLEANUP - DELETE NON-ITALY ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Fetch fresh count
  console.log('Current state:');
  const { data: current } = await supabase
    .from('associations')
    .select('country');

  const countMap = new Map();
  current?.forEach(row => {
    const c = row.country || 'NULL';
    countMap.set(c, (countMap.get(c) ?? 0) + 1);
  });

  countMap.forEach((count, country) => {
    console.log(`  ${country}: ${count}`);
  });
  console.log();

  // Get all non-Italy IDs
  const { data: nonItaly } = await supabase
    .from('associations')
    .select('id')
    .neq('country', 'Italy');

  const ids = nonItaly?.map(r => r.id) || [];
  console.log(`Deleting ${ids.length} non-Italy records...\n`);

  if (ids.length === 0) {
    console.log('✓ Already clean!\n');
    process.exit(0);
  }

  // Delete in chunks
  const chunkSize = 500;
  let totalDeleted = 0;

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);

    console.log(`Deleting chunk ${Math.floor(i / chunkSize) + 1} (${chunk.length} records)...`);

    const { error } = await supabase
      .from('associations')
      .delete()
      .in('id', chunk);

    if (error) {
      console.error(`  ✗ Failed:`, error.message);
    } else {
      totalDeleted += chunk.length;
      console.log(`  ✓ Deleted ${chunk.length}`);
    }
  }

  console.log(`\nTotal deleted: ${totalDeleted}\n`);

  // Verify
  console.log('Final state:');
  const { data: final } = await supabase
    .from('associations')
    .select('country');

  const finalMap = new Map();
  final?.forEach(row => {
    const c = row.country || 'NULL';
    finalMap.set(c, (finalMap.get(c) ?? 0) + 1);
  });

  finalMap.forEach((count, country) => {
    console.log(`  ${country}: ${count}`);
  });
  console.log(`\nTotal remaining: ${final?.length}\n`);
}

aggressiveCleanup().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
