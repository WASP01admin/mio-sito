#!/usr/bin/env node

/**
 * CLEANUP: DELETE NON-ITALY (ONE BY ONE)
 * More verbose to catch RLS/FK issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanupNonItaly() {
  console.log('Fetching all non-Italy associations...\n');

  const { data: records, error } = await supabase
    .from('associations')
    .select('id, code, country');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  const nonItaly = records?.filter(r => r.country !== 'Italy') || [];
  console.log(`Found ${nonItaly.length} non-Italy records\n`);

  if (nonItaly.length === 0) {
    console.log('✓ Database is clean!\n');
    process.exit(0);
  }

  // Try deleting with RLS bypass (admin key)
  console.log('Attempting delete with admin credentials...\n');

  let deleted = 0;
  for (const record of nonItaly) {
    const { error: delError } = await supabase
      .from('associations')
      .delete()
      .eq('id', record.id);

    if (delError) {
      console.log(`✗ ${record.code} (${record.country}): ${delError.message}`);
      if (deleted === 0) {
        console.log('\nRLS policy is blocking deletes. Need to adjust permissions.');
        console.log('This requires admin/database access.\n');
        process.exit(1);
      }
    } else {
      deleted++;
      process.stdout.write(`\rDeleted: ${deleted}/${nonItaly.length}`);
    }
  }

  console.log(`\n\n✓ Deleted ${deleted} records\n`);
}

cleanupNonItaly().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
