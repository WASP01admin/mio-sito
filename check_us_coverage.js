#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkUSCoverage() {
  console.log('Checking US association coverage...\n');

  // Total US associations
  const { data: total, error: e1 } = await supabase
    .from('associations')
    .select('id', { count: 'exact', head: true })
    .eq('country', 'USA');

  console.log(`Total US associations: ${total?.length || 0}`);

  // With coordinates
  const { data: withCoords, error: e2 } = await supabase
    .from('associations')
    .select('id', { count: 'exact', head: true })
    .eq('country', 'USA')
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  const coordCount = withCoords?.length || 0;
  console.log(`With coordinates: ${coordCount}`);

  // Without coordinates
  const { data: withoutCoords, error: e3 } = await supabase
    .from('associations')
    .select('id', { count: 'exact', head: true })
    .eq('country', 'USA')
    .is('lat', null);

  const noCoordCount = withoutCoords?.length || 0;
  console.log(`Without coordinates: ${noCoordCount}`);

  const total_us = (total?.length || 0) + (withoutCoords?.length || 0);
  const percent = total_us > 0 ? Math.round((coordCount / total_us) * 100) : 0;
  console.log(`\nCoverage: ${percent}% (${coordCount}/${total_us})`);

  // Sample some without coordinates
  console.log('\nSample US associations WITHOUT coordinates:');
  const { data: samples } = await supabase
    .from('associations')
    .select('id, name, city, state, country, address, email, website')
    .eq('country', 'USA')
    .is('lat', null)
    .limit(10);

  samples?.forEach((s, i) => {
    console.log(`\n${i + 1}. ${s.name}`);
    if (s.address) console.log(`   Address: ${s.address}`);
    if (s.city) console.log(`   City: ${s.city}`);
    if (s.state) console.log(`   State: ${s.state}`);
    if (s.email) console.log(`   Email: ${s.email}`);
    if (s.website) console.log(`   Website: ${s.website}`);
  });
}

checkUSCoverage().catch(console.error);
