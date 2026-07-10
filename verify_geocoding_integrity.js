#!/usr/bin/env node

/**
 * VERIFY GEOCODING INTEGRITY
 * Spot-check that coordinates match the expected organizations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verifyIntegrity() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  VERIFY GEOCODING INTEGRITY               ║');
  console.log('║  CRITICAL DATA CHECK                      ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Check for any records with suspicious data patterns
  console.log('CHECKING FOR INTEGRITY ISSUES:\n');

  // 1. Check for records with NULL/missing coordinates
  const { count: nullCount } = await supabase
    .from('associations')
    .select('*', { count: 'exact', head: true })
    .or('lat.is.null,lng.is.null');

  console.log(`✓ Records with NULL coordinates: ${nullCount} (acceptable)`);

  // 2. Check for records with BOTH lat and lng but one is NULL (impossible state)
  const { data: badCoords } = await supabase
    .from('associations')
    .select('code, name, lat, lng, country')
    .or('lat.is.null,lng.is.null')
    .is('lat', null)
    .not('lng', 'is', null)
    .limit(5);

  if (badCoords && badCoords.length > 0) {
    console.log(`\n⚠️  INTEGRITY ISSUE: Found records with LAT=NULL but LNG!=NULL:`);
    badCoords.forEach(r => {
      console.log(`   ${r.code}: ${r.name} (${r.country}) - lat=${r.lat}, lng=${r.lng}`);
    });
  } else {
    console.log(`✓ No records with mismatched lat/lng (good)`);
  }

  // 3. Check for records with obviously invalid coordinates (outside valid range)
  const { data: invalidCoords } = await supabase
    .from('associations')
    .select('code, name, country, lat, lng')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .or('lat.gt.90,lat.lt.-90,lng.gt.180,lng.lt.-180')
    .limit(5);

  if (invalidCoords && invalidCoords.length > 0) {
    console.log(`\n⚠️  INTEGRITY ISSUE: Found records with INVALID coordinates:`);
    invalidCoords.forEach(r => {
      console.log(`   ${r.code}: ${r.name} (${r.country}) - lat=${r.lat}, lng=${r.lng}`);
    });
  } else {
    console.log(`✓ All coordinates are within valid ranges`);
  }

  // 4. Spot-check: Sample 10 USA records and verify they're in USA
  console.log(`\n✓ Spot-checking USA associations (should have lat/lng near USA):`);
  const { data: usaSample } = await supabase
    .from('associations')
    .select('code, name, city, lat, lng')
    .eq('country', 'United States')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(10);

  let usaInBounds = 0;
  if (usaSample) {
    usaSample.forEach(r => {
      const inUSA = r.lat >= 24 && r.lat <= 50 && r.lng >= -125 && r.lng <= -66;
      const status = inUSA ? '✓' : '✗';
      console.log(`  ${status} ${r.code}: ${r.name.substring(0, 40)} - (${r.lat.toFixed(2)}, ${r.lng.toFixed(2)})`);
      if (inUSA) usaInBounds++;
    });
    console.log(`\n  USA Records in valid USA bounding box: ${usaInBounds}/10`);
  }

  // 5. Spot-check: Sample 10 Italy records
  console.log(`\n✓ Spot-checking Italy associations (should have lat/lng near Italy):`);
  const { data: italySample } = await supabase
    .from('associations')
    .select('code, name, city, lat, lng')
    .eq('country', 'Italy')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(10);

  let italyInBounds = 0;
  if (italySample) {
    italySample.forEach(r => {
      const inItaly = r.lat >= 36 && r.lat <= 47 && r.lng >= 6 && r.lng <= 19;
      const status = inItaly ? '✓' : '✗';
      console.log(`  ${status} ${r.code}: ${r.name.substring(0, 40)} - (${r.lat.toFixed(2)}, ${r.lng.toFixed(2)})`);
      if (inItaly) italyInBounds++;
    });
    console.log(`\n  Italy Records in valid Italy bounding box: ${italyInBounds}/10`);
  }

  // 6. Check for suspicious duplicates (same lat/lng for many different codes)
  console.log(`\n✓ Checking for suspicious coordinate duplicates...`);
  const { data: dupeCoords } = await supabase
    .from('associations')
    .select('lat, lng')
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  if (dupeCoords) {
    // Find coordinates that appear more than 20 times (suspicious)
    const coordMap = {};
    dupeCoords.forEach(row => {
      const key = `${row.lat.toFixed(4)},${row.lng.toFixed(4)}`;
      coordMap[key] = (coordMap[key] || 0) + 1;
    });

    const suspicious = Object.entries(coordMap).filter(([_, count]) => count > 20);
    if (suspicious.length > 0) {
      console.log(`  ⚠️  Found ${suspicious.length} coordinates used more than 20 times`);
      suspicious.slice(0, 5).forEach(([coord, count]) => {
        console.log(`     ${coord}: ${count} records`);
      });
    } else {
      console.log(`  ✓ No suspiciously duplicated coordinates`);
    }
  }

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  VERIFICATION COMPLETE                   ║');
  console.log('╚═══════════════════════════════════════════╝\n');
}

verifyIntegrity().catch(err => {
  console.error('✗ ERROR:', err.message);
  process.exit(1);
});
