#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function count() {
  console.log('Getting authoritative count...\n');

  // Count ALL
  const { count: total, error: e1 } = await supabase
    .from('associations')
    .select('*', { count: 'exact', head: true });

  // Count Italy
  const { count: italy, error: e2 } = await supabase
    .from('associations')
    .select('*', { count: 'exact', head: true })
    .eq('country', 'Italy');

  // Get distinct countries
  const { data: all } = await supabase
    .from('associations')
    .select('country');

  const countries = new Map();
  all?.forEach(r => {
    const c = r.country || 'NULL';
    countries.set(c, (countries.get(c) ?? 0) + 1);
  });

  console.log('Authoritative counts:');
  console.log(`  Total: ${total}`);
  console.log(`  Italy: ${italy}`);
  console.log(`  Other: ${(total || 0) - (italy || 0)}`);
  console.log('\nBreakdown:');
  Array.from(countries.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([c, n]) => {
      console.log(`  ${c}: ${n}`);
    });
}

count();
