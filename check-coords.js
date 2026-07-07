require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function check() {
  const { data, error } = await sb
    .from('associations')
    .select('id, name, lat, lng, city, country')
    .not('lat', 'is', null)
    .limit(20);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample of ' + data.length + ' coordinates:\n');
    data.forEach(d => {
      console.log(`${d.name} | ${d.city}, ${d.country} | LAT: ${d.lat} LNG: ${d.lng}`);
    });
  }
  process.exit(0);
}

check();
