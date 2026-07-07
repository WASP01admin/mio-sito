#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function deletePhantom() {
  console.log('Deleting phantom USA records...\n');

  const { data: usa } = await supabase
    .from('associations')
    .select('id, code, country')
    .eq('country', 'United States');

  console.log(`Found ${usa?.length || 0} USA records\n`);

  if (!usa || usa.length === 0) {
    console.log('✓ No USA records found\n');
    process.exit(0);
  }

  const ids = usa.map(r => r.id);
  let deleted = 0;

  for (const id of ids) {
    const { error } = await supabase
      .from('associations')
      .delete()
      .eq('id', id);

    if (!error) deleted++;
  }

  console.log(`✓ Deleted ${deleted} USA records\n`);
  console.log('Reload the map in your browser to see the clean Italy-only data.');
}

deletePhantom().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
