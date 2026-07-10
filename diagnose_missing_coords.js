#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function diagnose() {
  console.log('\n📊 DIAGNOSTICS - Missing Coordinates\n');

  // Get all records missing coordinates
  let allMissing = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data } = await supabase
      .from('associations')
      .select('code, name, city, country, lat, lng')
      .or('lat.is.null,lng.is.null')
      .range(offset, offset + pageSize - 1);

    if (!data || data.length === 0) break;
    allMissing = allMissing.concat(data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  console.log(`Total records missing coordinates: ${allMissing.length}`);
  console.log(`Total records with cities: ${allMissing.filter(r => r.city && r.city.trim()).length}`);
  console.log(`Total records without cities: ${allMissing.filter(r => !r.city || !r.city.trim()).length}\n`);

  // Sample by country
  const byCountry = {};
  allMissing.forEach(r => {
    if (!byCountry[r.country]) {
      byCountry[r.country] = { total: 0, withCity: 0, noCity: 0 };
    }
    byCountry[r.country].total++;
    if (r.city && r.city.trim()) {
      byCountry[r.country].withCity++;
    } else {
      byCountry[r.country].noCity++;
    }
  });

  console.log('By Country:');
  console.log('Country                  Total  With City  No City');
  console.log('─────────────────────────────────────────────────');
  Object.entries(byCountry)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([country, stats]) => {
      console.log(`${country.padEnd(24)} ${String(stats.total).padStart(5)}    ${String(stats.withCity).padStart(5)}      ${String(stats.noCity).padStart(5)}`);
    });

  // Sample some records with cities
  console.log('\n📍 Sample records with cities but no coordinates:');
  allMissing
    .filter(r => r.city && r.city.trim())
    .slice(0, 10)
    .forEach(r => {
      console.log(`${r.code} - ${r.name.substring(0, 40)}`);
      console.log(`   City: "${r.city}"\n`);
    });
}

diagnose();
