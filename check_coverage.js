#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkCoverage() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  MAP COVERAGE REPORT                      ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  const { count: totalCount } = await supabase
    .from('associations')
    .select('*', { count: 'exact', head: true });

  const { count: onMapCount } = await supabase
    .from('associations')
    .select('*', { count: 'exact', head: true })
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  const { data: byCounts } = await supabase
    .from('associations')
    .select('country')
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  const countryCounts = {};
  if (byCounts) {
    byCounts.forEach(r => {
      countryCounts[r.country] = (countryCounts[r.country] || 0) + 1;
    });
  }

  const coverage = totalCount > 0 ? ((onMapCount / totalCount) * 100).toFixed(1) : 0;

  console.log(`Total in DB: ${totalCount}`);
  console.log(`On map: ${onMapCount}`);
  console.log(`Coverage: ${coverage}%\n`);

  Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    console.log(`  ${c.padEnd(20)} ${n}`);
  });

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  ANALYSIS COMPLETE ✓                      ║');
  console.log('╚═══════════════════════════════════════════╝\n');
}

checkCoverage().catch(err => {
  console.error('✗ ERROR:', err.message);
  process.exit(1);
});
