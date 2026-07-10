#!/usr/bin/env node

/**
 * CLEANUP WITH FK: Delete map_messages first, then associations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function cleanup() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  CLEANUP: Handle FK constraints          ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Get non-Italy association IDs
  console.log('1. Fetching non-Italy association IDs...');
  const { data: nonItaly } = await supabase
    .from('associations')
    .select('id')
    .neq('country', 'Italy');

  const ids = nonItaly?.map(r => r.id) || [];
  console.log(`   Found ${ids.length} non-Italy records\n`);

  // Delete related map_messages
  console.log('2. Deleting related map_messages...');
  const { error: msgError } = await supabase
    .from('map_messages')
    .delete()
    .in('marker_id', ids);

  if (msgError) {
    console.log(`   ⚠ ${msgError.message}`);
  } else {
    console.log(`   ✓ Deleted\n`);
  }

  // Try deleting in smaller batches
  console.log('3. Deleting non-Italy associations (batches of 50)...');
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const { error } = await supabase
      .from('associations')
      .delete()
      .in('id', batch);

    if (error) {
      console.log(`   ✗ Batch failed: ${error.message}`);
      // Try one by one
      console.log(`   Trying one by one...`);
      for (const id of batch) {
        const { error: err } = await supabase
          .from('associations')
          .delete()
          .eq('id', id);
        if (!err) deleted++;
      }
    } else {
      deleted += batch.length;
    }
    process.stdout.write(`\r   Deleted: ${deleted}/${ids.length}`);
  }

  console.log(`\n\n✓ Total deleted: ${deleted}\n`);

  // Verify
  const { count: final } = await supabase
    .from('associations')
    .select('*', { count: 'exact' });

  const { count: italy } = await supabase
    .from('associations')
    .select('*', { count: 'exact' })
    .eq('country', 'Italy');

  console.log(`Final state:`);
  console.log(`  Total: ${final}`);
  console.log(`  Italy: ${italy}`);
  console.log(`  Other: ${(final || 0) - (italy || 0)}\n`);
}

cleanup().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
