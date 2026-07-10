#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

(async () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   VERIFYING ITALIAN IMPORT             ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Sample records
  const { data: sample } = await supabase
    .from('associations')
    .select('code, name, lat, lng, city, address')
    .limit(5);

  console.log('Sample records:');
  sample?.forEach(r => {
    const coordStatus = r.lat && r.lng ? '✓ YES' : '✗ NO';
    console.log(`  ${r.code} | ${r.name.substring(0, 35).padEnd(35)} | ${coordStatus}`);
  });

  // Total count
  const { data: all, error } = await supabase
    .from('associations')
    .select('id');

  console.log(`\n✓ Total in database: ${all?.length || 0}`);

  // Count with coordinates
  const { data: withCoords } = await supabase
    .from('associations')
    .select('code')
    .not('lat', 'is', null);

  console.log(`✓ Records with coordinates: ${withCoords?.length || 0}`);

  // Sample without coordinates
  const { data: noCoords } = await supabase
    .from('associations')
    .select('code, name, address')
    .is('lat', null)
    .limit(3);

  console.log('\nSample records without coordinates:');
  noCoords?.forEach(r => {
    console.log(`  ${r.code} | ${r.name.substring(0, 35).padEnd(35)} | ${r.address || '(no address)'}`);
  });

  console.log();
})();
