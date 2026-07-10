#!/usr/bin/env node

/**
 * CHECK ITALY DATA QUALITY
 * Examine what data exists for Italian associations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkItalyData() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  CHECK ITALY DATA QUALITY              ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Get sample Italian records without coords
  const { data: records } = await supabase
    .from('associations')
    .select('code, name, address, city, country')
    .eq('country', 'Italy')
    .lt('code', 'ITA0956')
    .is('lat', null)
    .limit(20);

  console.log('📊 Sample of 20 Italian records without coordinates:\n');

  let withAddress = 0;
  let withCity = 0;
  let withBoth = 0;

  records.forEach((rec, idx) => {
    const hasAddress = !!rec.address;
    const hasCity = !!rec.city;

    if (hasAddress) withAddress++;
    if (hasCity) withCity++;
    if (hasAddress && hasCity) withBoth++;

    console.log(`${idx + 1}. ${rec.code} | ${rec.name.substring(0, 35).padEnd(35)}`);
    console.log(`   Address: ${hasAddress ? rec.address.substring(0, 50) : '❌ MISSING'}`);
    console.log(`   City: ${hasCity ? rec.city : '❌ MISSING'}`);
    console.log();
  });

  console.log('📈 Summary stats:');
  console.log(`   Records with address: ${withAddress}/20`);
  console.log(`   Records with city: ${withCity}/20`);
  console.log(`   Records with BOTH: ${withBoth}/20\n`);

  // Get total counts
  const { data: allWithoutCoords } = await supabase
    .from('associations')
    .select('id, address, city')
    .eq('country', 'Italy')
    .lt('code', 'ITA0956')
    .is('lat', null);

  const totalWithAddress = allWithoutCoords.filter(r => r.address).length;
  const totalWithCity = allWithoutCoords.filter(r => r.city).length;
  const totalWithBoth = allWithoutCoords.filter(r => r.address && r.city).length;

  console.log('📈 TOTALS (all 554 missing-coord Italian records):');
  console.log(`   With address: ${totalWithAddress}/554`);
  console.log(`   With city: ${totalWithCity}/554`);
  console.log(`   With BOTH: ${totalWithBoth}/554\n`);
}

checkItalyData().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
