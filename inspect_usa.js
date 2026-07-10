#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function inspect() {
  const { data } = await supabase
    .from('associations')
    .select('id, code, name, country')
    .eq('country', 'United States')
    .limit(10);

  console.log('USA Records sample:');
  data?.forEach(r => {
    console.log(`  ${r.code} | ${r.name.substring(0, 40)} | ${r.country}`);
  });

  console.log(`\nTotal USA: ${data?.length}`);
}

inspect();
