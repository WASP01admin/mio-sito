#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function discover() {
  console.log('Discovering data structure...\n');

  // Get count by country
  const { data: all, error: e1 } = await supabase
    .from('associations')
    .select('country');

  const countryCounts = {};
  all?.forEach(rec => {
    const c = rec.country || 'NULL';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });

  console.log('Country value distribution:');
  Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([country, count]) => {
      console.log(`  ${country}: ${count}`);
    });

  // Find records that look like US
  console.log('\nLooking for US-like records...');
  const { data: samples } = await supabase
    .from('associations')
    .select('id, name, city, country, address, email, website')
    .or('country.ilike.%US%,country.ilike.%United%,country.ilike.%America%')
    .limit(5);

  console.log(`\nUS-like records (first 5):`);
  samples?.forEach((s, i) => {
    console.log(`\n${i + 1}. ${s.name}`);
    console.log(`   Country: ${s.country}`);
    if (s.city) console.log(`   City: ${s.city}`);
    if (s.address) console.log(`   Address: ${s.address}`);
  });

  // Check record count by country
  console.log('\n\nTop countries by record count:');
  const sorted = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sorted.forEach(([country, count]) => {
    console.log(`  ${country}: ${count}`);
  });
}

discover().catch(console.error);
