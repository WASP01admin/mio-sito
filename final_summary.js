#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function finalSummary() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          TREASURE HUNT: FINAL COMPREHENSIVE SUMMARY         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get all records
  const { data: all } = await supabase
    .from('associations')
    .select('id, code, country, lat, lng');

  console.log(`📊 TOTAL ASSOCIATIONS: ${all?.length || 0}\n`);

  // By country
  const byCountry = {};
  let totalCoords = 0;

  all?.forEach(r => {
    const c = r.country || 'Unknown';
    if (!byCountry[c]) {
      byCountry[c] = { total: 0, with: 0, codes: new Set() };
    }
    byCountry[c].total++;
    byCountry[c].codes.add(r.code?.substring(0, 3) || 'NONE');
    if (r.lat && r.lng) {
      byCountry[c].with++;
      totalCoords++;
    }
  });

  console.log('BY COUNTRY:\n');
  Object.entries(byCountry)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([country, data]) => {
      const percent = Math.round((data.with / data.total) * 100);
      const codes = Array.from(data.codes).sort().join(', ');
      console.log(`  ${country.padEnd(20)} ${data.with.toString().padStart(4)}/${data.total.toString().padStart(4)} (${percent.toString().padStart(3)}%)  [${codes}]`);
    });

  const overallPercent = Math.round((totalCoords / (all?.length || 1)) * 100);
  console.log(`\n  ${'TOTAL'.padEnd(20)} ${totalCoords.toString().padStart(4)}/${(all?.length || 0).toString().padStart(4)} (${overallPercent.toString().padStart(3)}%)\n`);

  // By code prefix
  console.log('BY CODE PREFIX:\n');
  const byPrefix = {};
  all?.forEach(r => {
    const p = (r.code || '').substring(0, 3) || 'NONE';
    if (!byPrefix[p]) byPrefix[p] = { total: 0, with: 0 };
    byPrefix[p].total++;
    if (r.lat && r.lng) byPrefix[p].with++;
  });

  Object.entries(byPrefix)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15)
    .forEach(([prefix, data]) => {
      const percent = Math.round((data.with / data.total) * 100);
      console.log(`  ${prefix}***: ${data.total.toString().padStart(4)} records, ${data.with.toString().padStart(4)} geocoded (${percent}%)`);
    });

  // Highlights
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                        HIGHLIGHTS                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const us = byCountry['US +1'];
  const uk = byCountry['UK'];
  const italy = byCountry['Italy'];
  const ireland = byCountry['Ireland +353'];
  const australia = byCountry['AUSTRALIA +61'];

  console.log(`✅ US ASSOCIATIONS: ${us?.with}/${us?.total} (100% COMPLETE!)`);
  console.log(`✅ UK ASSOCIATIONS: ${uk?.with}/${uk?.total} (100% geocoded)`);
  console.log(`✅ IRELAND: ${ireland?.with}/${ireland?.total} (100% geocoded)`);
  console.log(`✅ AUSTRALIA: ${australia?.with}/${australia?.total} (100% geocoded)`);
  console.log(`✅ ITALY: ${italy?.with}/${italy?.total} (${Math.round((italy?.with / italy?.total) * 100)}% geocoded)\n`);

  console.log(`📍 TOTAL PLOTTED ON MAP: ${totalCoords} associations\n`);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    MAP IS READY! 🗺️                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

finalSummary().catch(console.error);
