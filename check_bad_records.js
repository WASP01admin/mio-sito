const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkBadRecords() {
  console.log('\nCHECKING CORRUPTED RECORDS:\n');
  
  // Check the 4 Italian records with mismatched lat/lng
  const { data: italianBad } = await supabase
    .from('associations')
    .select('code, name, lat, lng')
    .in('code', ['ITA0080', 'ITA0099', 'ITA0514', 'ITA0513']);
  
  console.log('Italian records with lat=NULL but lng!=NULL:');
  italianBad.forEach(r => {
    console.log(`  ${r.code}: ${r.name} - lat=${r.lat}, lng=${r.lng}`);
  });

  // Check USA0011 with Australian coordinates
  const { data: usa0011 } = await supabase
    .from('associations')
    .select('code, name, country, city, address, lat, lng')
    .eq('code', 'USA0011')
    .limit(1);
  
  console.log('\nUSA0011 (has Australian coordinates):');
  if (usa0011 && usa0011.length > 0) {
    const r = usa0011[0];
    console.log(`  Code: ${r.code}`);
    console.log(`  Name: ${r.name}`);
    console.log(`  Country: ${r.country}`);
    console.log(`  City: ${r.city}`);
    console.log(`  Address: ${r.address}`);
    console.log(`  Coordinates: (${r.lat}, ${r.lng})`);
  }
}

checkBadRecords().catch(e => console.error(e.message));
