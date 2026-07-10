#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function diagnose() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  USA DATABASE DIAGNOSTIC                  ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Total USA records
  const { count: totalUSA } = await supabase
    .from('associations')
    .select('*', { count: 'exact', head: true })
    .eq('country', 'United States');

  // USA with both lat AND lng
  const { count: withBoth } = await supabase
    .from('associations')
    .select('*', { count: 'exact', head: true })
    .eq('country', 'United States')
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  // USA with lat but no lng
  const { count: latOnly } = await supabase
    .from('associations')
    .select('*', { count: 'exact', head: true })
    .eq('country', 'United States')
    .not('lat', 'is', null)
    .is('lng', null);

  // USA with lng but no lat
  const { count: lngOnly } = await supabase
    .from('associations')
    .select('*', { count: 'exact', head: true })
    .eq('country', 'United States')
    .is('lat', null)
    .not('lng', 'is', null);

  // USA with neither
  const { count: neither } = await supabase
    .from('associations')
    .select('*', { count: 'exact', head: true })
    .eq('country', 'United States')
    .is('lat', null)
    .is('lng', null);

  console.log(`Total USA records in DB: ${totalUSA}`);
  console.log(`With BOTH lat + lng: ${withBoth}`);
  console.log(`Lat only (no lng): ${latOnly}`);
  console.log(`Lng only (no lat): ${lngOnly}`);
  console.log(`Neither lat nor lng: ${neither}`);
  console.log(`\nCoverage: ${((withBoth/totalUSA)*100).toFixed(1)}%`);

  if (latOnly > 0 || lngOnly > 0) {
    console.log('\n⚠️  PROBLEM: Found mismatched coordinates!');
    if (latOnly > 0) {
      const { data } = await supabase
        .from('associations')
        .select('code, name, lat, lng')
        .eq('country', 'United States')
        .not('lat', 'is', null)
        .is('lng', null)
        .limit(3);
      console.log(`\nSample LAT-only records:`);
      data.forEach(r => console.log(`  ${r.code}: lat=${r.lat}, lng=${r.lng}`));
    }
  }

  // Check specific geocoded codes
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  CHECKING GEOCODED CODE SAMPLES           ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  const testCodes = ['USA0206', 'USA0500', 'USA1000', 'USA1500', 'USA1561'];
  let found = 0;
  let missing = 0;
  let hasCoords = 0;

  for (const code of testCodes) {
    const { data } = await supabase
      .from('associations')
      .select('code, name, lat, lng')
      .eq('code', code)
      .eq('country', 'United States');

    if (data && data.length > 0) {
      const r = data[0];
      if (r.lat !== null && r.lng !== null) {
        console.log(`✓ ${code}: "${r.name.substring(0, 40)}" → lat=${r.lat}, lng=${r.lng}`);
        hasCoords++;
      } else {
        console.log(`⚠ ${code}: "${r.name.substring(0, 40)}" → lat=${r.lat}, lng=${r.lng}`);
      }
      found++;
    } else {
      console.log(`✗ ${code}: NOT IN DATABASE`);
      missing++;
    }
  }

  console.log(`\nSample check: ${found} found, ${missing} missing, ${hasCoords} with coords`);

  // Random sample from high-numbered codes (should be from geocoding)
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  RANDOM SAMPLE FROM GEOCODED RANGE        ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  const { data: randomSample } = await supabase
    .from('associations')
    .select('code, name, lat, lng')
    .eq('country', 'United States')
    .gte('code', 'USA0200')
    .lte('code', 'USA1600')
    .limit(10);

  console.log(`Found ${randomSample ? randomSample.length : 0} records in USA0200-USA1600 range:\n`);
  if (randomSample) {
    randomSample.forEach(r => {
      const hasCoords = r.lat !== null && r.lng !== null ? '✓' : '✗';
      console.log(`${hasCoords} ${r.code}: lat=${r.lat}, lng=${r.lng}`);
    });
  }
}

diagnose().catch(err => {
  console.error('\n✗ ERROR:', err.message);
  process.exit(1);
});
