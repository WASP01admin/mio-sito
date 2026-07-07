#!/usr/bin/env node

/**
 * VERIFY COUNTRIES IN DATABASE
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyCountries() {
  console.log('Fetching all associations by country...\n');

  const { data: allAssociations, error } = await supabase
    .from('associations')
    .select('id, code, country');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  const countryMap = new Map();
  allAssociations.forEach(row => {
    const country = row.country || 'NULL';
    countryMap.set(country, (countryMap.get(country) ?? 0) + 1);
  });

  const countries = Array.from(countryMap.entries())
    .sort((a, b) => b[1] - a[1]);

  console.log('Countries in database:');
  console.log('━'.repeat(40));
  countries.forEach(([country, count]) => {
    console.log(`${country.padEnd(20)} : ${count}`);
  });

  console.log('\n' + '━'.repeat(40));
  console.log(`Total associations: ${allAssociations.length}`);
  console.log(`Total countries: ${countries.length}\n`);

  // Check for codes that should exist
  console.log('Sample codes by country:');
  console.log('━'.repeat(40));
  const codesByCountry = new Map();
  allAssociations.slice(0, 200).forEach(row => {
    const country = row.country || 'NULL';
    if (!codesByCountry.has(country)) {
      codesByCountry.set(country, []);
    }
    codesByCountry.get(country).push(row.code);
  });

  codesByCountry.forEach((codes, country) => {
    console.log(`${country}: ${codes.slice(0, 3).join(', ')}...`);
  });
}

verifyCountries().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
