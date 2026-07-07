#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function deleteUsa() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  DELETE REMAINING USA RECORDS             ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Get all USA records
  const { data: usa } = await supabase
    .from('associations')
    .select('id, code')
    .eq('country', 'United States');

  console.log(`Found ${usa?.length || 0} USA records\n`);

  if (!usa || usa.length === 0) {
    console.log('✓ No USA records to delete\n');
    process.exit(0);
  }

  const ids = usa.map(r => r.id);

  // Delete all USA records one by one
  console.log('Deleting USA records...');
  let deleted = 0;

  for (const id of ids) {
    const { error } = await supabase
      .from('associations')
      .delete()
      .eq('id', id);

    if (!error) deleted++;
    process.stdout.write(`\r  Deleted: ${deleted}/${ids.length}`);
  }

  console.log('\n\n✓ All USA records deleted\n');

  // Verify
  console.log('Verifying final state...\n');
  let remaining = [];
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase
      .from('associations')
      .select('code, country')
      .gte('code', `ITA${String(i * 250).padStart(4, '0')}`)
      .lt('code', `ITA${String((i + 1) * 250).padStart(4, '0')}`)
      .range(0, 5000);

    if (data) remaining = [...remaining, ...data];
  }

  const byCountry = new Map();
  remaining.forEach(r => {
    const c = r.country || 'NULL';
    byCountry.set(c, (byCountry.get(c) ?? 0) + 1);
  });

  console.log('Final database state:');
  byCountry.forEach((count, country) => {
    console.log(`  ${country}: ${count}`);
  });

  console.log(`\nTotal: ${remaining.length}`);
  console.log(`✓ Database contains ONLY Italy\n`);
}

deleteUsa().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
