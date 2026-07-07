#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function realCount() {
  console.log('REAL DATABASE COUNT\n');

  // Get ALL records, no limit
  const { data: all } = await supabase
    .from('associations')
    .select('id, code, country, lat, lng');

  console.log(`Total records in database: ${all?.length || 0}`);
  console.log();

  // Group by code prefix
  const byPrefix = {};
  const byCountry = {};
  let coordCount = 0;

  all?.forEach(r => {
    const prefix = (r.code || '').substring(0, 3) || 'NONE';
    byPrefix[prefix] = (byPrefix[prefix] || 0) + 1;

    const country = r.country || 'Unknown';
    byCountry[country] = (byCountry[country] || 0) + 1;

    if (r.lat && r.lng) coordCount++;
  });

  console.log('By code prefix:');
  Object.entries(byPrefix)
    .sort((a, b) => b[1] - a[1])
    .forEach(([prefix, count]) => {
      console.log(`  ${prefix}***: ${count}`);
    });

  console.log('\nBy country:');
  Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, count]) => {
      console.log(`  ${country}: ${count}`);
    });

  const total = all?.length || 0;
  const percent = total > 0 ? Math.round((coordCount / total) * 100) : 0;
  console.log(`\nCoordinate coverage: ${coordCount}/${total} (${percent}%)`);
}

realCount().catch(console.error);
