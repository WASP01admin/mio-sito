#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function check() {
  console.log('Checking country field for all ITA records...\n');

  // Get all records with ITA code (without country filter)
  let allIta = [];
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase
      .from('associations')
      .select('code, country')
      .gte('code', `ITA${String(i * 250).padStart(4, '0')}`)
      .lt('code', `ITA${String((i + 1) * 250).padStart(4, '0')}`)
      .range(0, 5000);

    if (data) allIta = [...allIta, ...data];
  }

  console.log(`Total ITA records found: ${allIta.length}\n`);

  const byCountry = new Map();
  allIta.forEach(r => {
    const c = r.country || 'NULL';
    byCountry.set(c, (byCountry.get(c) ?? 0) + 1);
  });

  console.log('ITA records by country:');
  byCountry.forEach((count, country) => {
    console.log(`  ${country}: ${count}`);
  });

  const codes = allIta.map(r => r.code).sort();
  console.log(`\nCode range:`);
  console.log(`  First: ${codes[0]}`);
  console.log(`  Last: ${codes[codes.length - 1]}`);

  // Check for broken ones (without country)
  const broken = allIta.filter(r => !r.country || r.country === 'NULL');
  console.log(`\nRecords without country: ${broken.length}`);
  if (broken.length > 0) {
    console.log('Sample codes without country:');
    broken.slice(0, 10).forEach(r => {
      console.log(`  ${r.code}`);
    });
  }
}

check();
