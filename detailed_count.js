#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function count() {
  console.log('Detailed record count analysis...\n');

  // Count all records
  const { data: all } = await supabase
    .from('associations')
    .select('id, code, created_at, country');

  console.log(`Total records in database: ${all?.length || 0}\n`);

  // Group by code prefix to see which phase they came from
  const byPrefix = {};
  all?.forEach(r => {
    const prefix = r.code?.substring(0, 3) || 'NONE';
    byPrefix[prefix] = (byPrefix[prefix] || 0) + 1;
  });

  console.log('By code prefix:');
  Object.entries(byPrefix)
    .sort((a, b) => b[1] - a[1])
    .forEach(([prefix, count]) => {
      console.log(`  ${prefix}***: ${count}`);
    });

  // Group by country
  const byCountry = {};
  all?.forEach(r => {
    const c = r.country || 'NULL';
    byCountry[c] = (byCountry[c] || 0) + 1;
  });

  console.log('\nBy country:');
  Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, count]) => {
      console.log(`  ${country}: ${count}`);
    });

  // Sample records with different code prefixes
  console.log('\nSample records by code:');
  const sampleCodes = ['OTH', 'ITA', 'AUS', 'UK0', 'IRL'];
  for (const code of sampleCodes) {
    const { data: sample } = await supabase
      .from('associations')
      .select('code, name, country')
      .ilike('code', code + '%')
      .limit(1);

    if (sample?.length > 0) {
      const rec = sample[0];
      console.log(`  ${rec.code}: "${rec.name}" (${rec.country})`);
    }
  }
}

count().catch(console.error);
