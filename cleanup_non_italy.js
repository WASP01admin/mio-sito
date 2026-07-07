#!/usr/bin/env node

/**
 * CLEANUP: DELETE ALL NON-ITALY ASSOCIATIONS
 * Keep only: Italy (ITA0001-ITA0955) + PIEMONTE (ITA0956-ITA1248)
 * Delete: Canada, USA, and any other countries
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanupNonItaly() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  CLEANUP: DELETE NON-ITALY             ║');
  console.log('║  Keep only Italy + PIEMONTE            ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Get all non-Italy associations
  console.log('1. Fetching non-Italy associations...');
  const { data: nonItaly, error: fetchError } = await supabase
    .from('associations')
    .select('id, code, country')
    .neq('country', 'Italy');

  if (fetchError) {
    console.error('Error fetching:', fetchError);
    process.exit(1);
  }

  console.log(`   Found ${nonItaly?.length || 0} non-Italy associations\n`);

  if (!nonItaly || nonItaly.length === 0) {
    console.log('✓ Database is clean! Only Italy associations remain.\n');
    process.exit(0);
  }

  // Group by country
  const byCountry = new Map();
  nonItaly.forEach(row => {
    if (!byCountry.has(row.country)) {
      byCountry.set(row.country, []);
    }
    byCountry.get(row.country).push(row.id);
  });

  console.log('2. Countries to delete:');
  byCountry.forEach((ids, country) => {
    console.log(`   - ${country}: ${ids.length} associations`);
  });
  console.log();

  // Delete map_messages for these associations first
  console.log('3. Deleting related map_messages...');
  const allIds = Array.from(byCountry.values()).flat();

  const { data: messages } = await supabase
    .from('map_messages')
    .select('id')
    .in('marker_id', allIds);

  if (messages && messages.length > 0) {
    const { error: msgError } = await supabase
      .from('map_messages')
      .delete()
      .in('marker_id', allIds);

    if (msgError) {
      console.error('Error deleting messages:', msgError);
      process.exit(1);
    }
    console.log(`   ✓ Deleted ${messages.length} map messages\n`);
  } else {
    console.log('   ✓ No map messages to delete\n');
  }

  // Delete all non-Italy associations
  console.log('4. Deleting non-Italy associations...');
  const { error: deleteError } = await supabase
    .from('associations')
    .delete()
    .in('id', allIds);

  if (deleteError) {
    console.error('Error deleting:', deleteError);
    process.exit(1);
  }

  console.log(`   ✓ Deleted ${allIds.length} associations\n`);

  // Verify final state
  console.log('5. Verifying final state...');
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
  console.log(`✓ Total remaining: ${remaining?.length || 0}`);
  console.log(`✓ Only Italy data preserved\n`);
}

cleanupNonItaly().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
