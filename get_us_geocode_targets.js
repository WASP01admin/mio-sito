#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getTargets() {
  console.log('Finding US +1 records without coordinates...\n');

  // Get all US +1 records
  const { data: all, error } = await supabase
    .from('associations')
    .select('id, name, address, city, phone, email, website, lat, lng')
    .eq('country', 'US +1');

  console.log(`Total US +1 records: ${all?.length || 0}`);

  if (!all || all.length === 0) {
    console.log('No records found!');
    process.exit(1);
  }

  // Split by coordinate status
  const withCoords = all.filter(r => r.lat && r.lng);
  const withoutCoords = all.filter(r => !r.lat || !r.lng);

  console.log(`With coordinates: ${withCoords.length}`);
  console.log(`Without coordinates: ${withoutCoords.length}`);

  const percent = withCoords.length > 0
    ? Math.round((withCoords.length / all.length) * 100)
    : 0;
  console.log(`Coverage: ${percent}%\n`);

  // Sample the records without coords
  console.log('Sample records needing geocoding:');
  withoutCoords.slice(0, 20).forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.name}`);
    if (r.address) console.log(`   Address: ${r.address}`);
    if (r.phone) console.log(`   Phone: ${r.phone}`);
    if (r.website) console.log(`   Website: ${r.website}`);
  });

  console.log(`\n... and ${withoutCoords.length - 20} more without coordinates`);
}

getTargets().catch(console.error);
