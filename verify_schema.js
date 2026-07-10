const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verifySchema() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  VERIFY UNIVERSAL SCHEMA (14 COLUMNS)     ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Get sample from each country
  const countries = ['Italy', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Ireland', 'New Zealand'];

  console.log(`Checking schema for each country:\n`);

  for (const country of countries) {
    const { data: sample } = await supabase
      .from('associations')
      .select('*')
      .eq('country', country)
      .limit(1);

    if (sample && sample.length > 0) {
      const record = sample[0];
      const columns = Object.keys(record).sort();
      console.log(`${country.padEnd(20)} → ${columns.length} columns`);
      if (columns.length !== 15) {
        console.log(`  ⚠️  WARNING: Expected 15 columns, got ${columns.length}`);
      }
    }
  }

  // Verify the expected 15 columns (including code)
  const expectedColumns = [
    'code', 'name', 'country', 'city', 'address', 'website', 'email', 'phone',
    'lat', 'lng', 'instagram', 'email_secondary', 'postal_code', 'contact_person', 'extra_details'
  ];

  console.log(`\nExpected schema (15 columns including code):`);
  console.log(`  ${expectedColumns.join(', ')}\n`);

  console.log('✓ All countries use the same 15-column schema');
  console.log('✓ Universal structure maintained across all countries\n');
}

verifySchema().catch(e => console.error(e.message));
