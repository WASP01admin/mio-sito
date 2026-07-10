#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkUS() {
  console.log('US +1 ASSOCIATION COVERAGE\n');

  // Total US +1
  const { data: total } = await supabase
    .from('associations')
    .select('id', { count: 'exact', head: true })
    .eq('country', 'US +1');

  const totalUS = total?.length || 0;
  console.log(`Total US +1 associations: ${totalUS}`);

  // With coordinates
  const { data: withCoords } = await supabase
    .from('associations')
    .select('id', { count: 'exact', head: true })
    .eq('country', 'US +1')
    .not('lat', 'is', null);

  const coordCount = withCoords?.length || 0;
  console.log(`With coordinates: ${coordCount}`);

  // Without
  const noCoordCount = totalUS - coordCount;
  console.log(`Without coordinates: ${noCoordCount}`);

  const percent = totalUS > 0 ? Math.round((coordCount / totalUS) * 100) : 0;
  console.log(`\nCoverage: ${percent}% (${coordCount}/${totalUS})`);

  console.log('\nSample US +1 without coordinates:');
  const { data: samples } = await supabase
    .from('associations')
    .select('name, address, city, phone, email, website')
    .eq('country', 'US +1')
    .is('lat', null)
    .limit(15);

  samples?.forEach((s, i) => {
    console.log(`\n${i + 1}. ${s.name}`);
    if (s.address) console.log(`   Address: ${s.address}`);
    if (s.phone) console.log(`   Phone: ${s.phone}`);
    if (s.email) console.log(`   Email: ${s.email}`);
    if (s.website) console.log(`   Website: ${s.website}`);
  });
}

checkUS().catch(console.error);
