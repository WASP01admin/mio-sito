#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function check() {
  console.log('Checking for PIEMONTE records (ITA0956-ITA1248)...\n');

  const { data: piemonte } = await supabase
    .from('associations')
    .select('code, name')
    .gte('code', 'ITA0956')
    .lte('code', 'ITA1248');

  console.log(`PIEMONTE records found: ${piemonte?.length || 0}\n`);

  if (piemonte && piemonte.length > 0) {
    console.log('Sample PIEMONTE records:');
    piemonte.slice(0, 10).forEach(r => {
      console.log(`  ${r.code} | ${r.name.substring(0, 50)}`);
    });
    if (piemonte.length > 10) {
      console.log(`  ... and ${piemonte.length - 10} more`);
    }
  } else {
    console.log('⚠️  NO PIEMONTE RECORDS FOUND!');
  }

  // Check all Italy codes
  const { data: allItaly } = await supabase
    .from('associations')
    .select('code')
    .eq('country', 'Italy');

  if (allItaly) {
    const codes = allItaly.map(r => r.code).sort();
    console.log(`\n\nAll Italy codes (${codes.length} total):`);
    console.log(`  First: ${codes[0]}`);
    console.log(`  Last: ${codes[codes.length - 1]}`);

    // Check for gaps
    const ita = codes.filter(c => c.startsWith('ITA'));
    console.log(`\n  ITA-coded records: ${ita.length}`);
    if (ita.length > 0) {
      console.log(`    First ITA: ${ita[0]}`);
      console.log(`    Last ITA: ${ita[ita.length - 1]}`);
    }
  }
}

check();
