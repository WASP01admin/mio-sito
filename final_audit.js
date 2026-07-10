#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function audit() {
  console.log('========================================');
  console.log('FINAL COMPREHENSIVE AUDIT');
  console.log('========================================\n');

  // Get all records
  const { data: all } = await supabase
    .from('associations')
    .select('id, country, lat, lng');

  console.log(`TOTAL ASSOCIATIONS: ${all?.length || 0}\n`);

  // Group by country
  const byCountry = {};
  all?.forEach(r => {
    const c = r.country || 'Unknown';
    if (!byCountry[c]) {
      byCountry[c] = { total: 0, withCoords: 0 };
    }
    byCountry[c].total++;
    if (r.lat && r.lng) {
      byCountry[c].withCoords++;
    }
  });

  // Display by country
  console.log('BY COUNTRY:');
  Object.entries(byCountry)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([country, counts]) => {
      const percent = Math.round((counts.withCoords / counts.total) * 100);
      console.log(`\n${country}:`);
      console.log(`  Total: ${counts.total}`);
      console.log(`  With coords: ${counts.withCoords}`);
      console.log(`  Coverage: ${percent}%`);
    });

  // Overall stats
  const totalCoords = all?.filter(r => r.lat && r.lng).length || 0;
  const totalAssocs = all?.length || 0;
  const overallPercent = totalAssocs > 0 ? Math.round((totalCoords / totalAssocs) * 100) : 0;

  console.log('\n========================================');
  console.log('OVERALL STATISTICS:');
  console.log('========================================');
  console.log(`Total associations: ${totalAssocs}`);
  console.log(`With coordinates: ${totalCoords}`);
  console.log(`Without coordinates: ${totalAssocs - totalCoords}`);
  console.log(`Coverage: ${overallPercent}%`);
  console.log();
  console.log(`🗺️ MAP READY: ${totalCoords} associations plotted!`);
}

audit().catch(console.error);
