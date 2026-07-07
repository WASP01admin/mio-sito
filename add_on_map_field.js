#!/usr/bin/env node

/**
 * ADD on_map FIELD TO ASSOCIATIONS TABLE
 * on_map = true if has LAT/LNG coordinates
 * on_map = false if missing LAT or LNG
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function addOnMapField() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  ADD on_map FIELD TO ASSOCIATIONS        ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Get all associations
  console.log('1. Fetching all associations...');
  let allRecords = [];
  let offset = 0;
  const pageSize = 5000;

  while (true) {
    const { data } = await supabase
      .from('associations')
      .select('id, lat, lng')
      .range(offset, offset + pageSize - 1);

    if (!data || data.length === 0) break;
    allRecords = [...allRecords, ...data];
    console.log(`   Fetched: ${allRecords.length}`);

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  console.log(`   Total: ${allRecords.length}\n`);

  // Categorize
  const onMap = allRecords.filter(r => r.lat && r.lng).map(r => r.id);
  const offMap = allRecords.filter(r => !r.lat || !r.lng).map(r => r.id);

  console.log('2. Status breakdown:');
  console.log(`   ON MAP (has coordinates): ${onMap.length}`);
  console.log(`   OFF MAP (missing coordinates): ${offMap.length}\n`);

  // Update ON MAP records
  console.log('3. Updating records...');
  let updated = 0;

  if (onMap.length > 0) {
    console.log(`   Setting on_map=true for ${onMap.length} records...`);
    for (let i = 0; i < onMap.length; i += 500) {
      const batch = onMap.slice(i, i + 500);
      const { error } = await supabase
        .from('associations')
        .update({ on_map: true })
        .in('id', batch);

      if (!error) updated += batch.length;
      process.stdout.write(`\r     Updated: ${updated}/${onMap.length}`);
    }
    console.log();
  }

  // Update OFF MAP records
  updated = 0;
  if (offMap.length > 0) {
    console.log(`   Setting on_map=false for ${offMap.length} records...`);
    for (let i = 0; i < offMap.length; i += 500) {
      const batch = offMap.slice(i, i + 500);
      const { error } = await supabase
        .from('associations')
        .update({ on_map: false })
        .in('id', batch);

      if (!error) updated += batch.length;
      process.stdout.write(`\r     Updated: ${updated}/${offMap.length}`);
    }
    console.log();
  }

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  ✓ on_map FIELD SUCCESSFULLY ADDED       ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  console.log('Now update the admin UI to support sorting by on_map.\n');
}

addOnMapField().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
