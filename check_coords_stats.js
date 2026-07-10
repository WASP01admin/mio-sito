#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function check() {
  console.log('Italy coordinate statistics:\n');

  // Get all Italy records
  let allItaly = [];
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase
      .from('associations')
      .select('code, lat, lng')
      .gte('code', `ITA${String(i * 250).padStart(4, '0')}`)
      .lt('code', `ITA${String((i + 1) * 250).padStart(4, '0')}`)
      .range(0, 5000);

    if (data) allItaly = [...allItaly, ...data];
  }

  const withCoords = allItaly.filter(r => r.lat && r.lng);
  const withoutCoords = allItaly.filter(r => !r.lat || !r.lng);

  console.log(`Total Italian associations: ${allItaly.length}`);
  console.log(`With coordinates (LAT/LNG): ${withCoords.length} (${Math.round(withCoords.length / allItaly.length * 100)}%)`);
  console.log(`Missing coordinates: ${withoutCoords.length}\n`);

  // Show code ranges
  const codes = allItaly.map(r => r.code).sort();
  console.log(`Code range: ${codes[0]} to ${codes[codes.length - 1]}`);

  // Sample missing
  const missingCodes = withoutCoords.map(r => r.code).slice(0, 20);
  console.log(`\nSample missing coordinates:`);
  missingCodes.forEach(c => console.log(`  ${c}`));
  if (withoutCoords.length > 20) {
    console.log(`  ... and ${withoutCoords.length - 20} more`);
  }
}

check();
