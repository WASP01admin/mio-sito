const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkColumns() {
  const { data: sample } = await supabase
    .from('associations')
    .select('*')
    .limit(1);

  if (sample && sample.length > 0) {
    const columns = Object.keys(sample[0]).sort();
    
    const planned = [
      'code', 'name', 'country', 'city', 'address', 'website', 'email', 'phone',
      'lat', 'lng', 'instagram', 'email_secondary', 'postal_code', 'contact_person', 'extra_details'
    ];

    const extra = columns.filter(c => !planned.includes(c));

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  COLUMN ANALYSIS                          ║');
    console.log('╚═══════════════════════════════════════════╝\n');
    console.log(`Planned (14 + code): ${planned.length}\n`);
    console.log(`Actual columns: ${columns.length}\n`);
    console.log(`EXTRA COLUMNS FOUND: ${extra.length}`);
    extra.forEach(c => console.log(`  - ${c}`));
  }
}

checkColumns().catch(e => console.error(e.message));
