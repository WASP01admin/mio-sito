require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
  const { data, error } = await sb
    .from('associations')
    .select('id, name, lat, lng')
    .not('lat', 'is', null)
    .limit(5);

  if (error) {
    console.error('❌ DB Error:', error.message);
  } else {
    console.log('✓ Found ' + (data?.length || 0) + ' associations with coordinates');
    if (data?.length) {
      console.log('Sample record:', data[0]);
    }
  }
  process.exit(0);
}

test();
