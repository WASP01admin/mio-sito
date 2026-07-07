#!/usr/bin/env node

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function matchSheet1() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  MATCH SHEET1 ORGANIZATIONS TO CODES     ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Read Sheet1 CSV manually (no csv-parser)
  const content = fs.readFileSync('C:\\Users\\robbu\\Downloads\\united_states_missing_coords - Sheet1.csv', 'utf8');
  const lines = content.split('\n');

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing
    const parts = line.split(',');
    if (parts.length < 3) continue;

    const orgName = parts[0].replace(/^"/, '').replace(/"$/, '').trim();
    const website = parts[1].replace(/^"/, '').replace(/"$/, '').trim();
    const city = parts[2]?.replace(/^"/, '').replace(/"$/, '').trim() || '';

    // Filter out headers and invalid entries
    if (website === 'Header Only' || city === '—' || city === '') continue;
    if (orgName.startsWith('USA -')) continue;

    // Extract just city name (remove state in parentheses)
    const cleanCity = city.split('(')[0].trim();

    records.push({ orgName, cleanCity });
  }

  console.log(`Found ${records.length} valid organizations\n`);

  // Query database for USA records with these names
  console.log('Searching database for matching organizations...\n');

  const results = [];
  let found = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    try {
      // Search for organization by name substring
      const searchTerm = record.orgName.substring(0, 25);

      const { data } = await supabase
        .from('associations')
        .select('code, name')
        .eq('country', 'United States')
        .ilike('name', `%${searchTerm}%`)
        .limit(1);

      if (data && data.length > 0) {
        results.push({
          code: data[0].code,
          city: record.cleanCity
        });
        found++;
      }

      if ((i + 1) % 50 === 0) {
        process.stdout.write(`  Processed: ${i + 1}/${records.length}\r`);
      }
    } catch (err) {
      console.error(`Error searching for ${record.orgName}:`, err.message);
    }
  }

  console.log(`\n✓ Found matches: ${found}/${records.length}\n`);

  // Write CSV for geocoding
  if (results.length > 0) {
    const csv = 'code,city\n' + results.map(r => `${r.code},${r.city}`).join('\n');
    fs.writeFileSync('usa_sheet1_cities.csv', csv);
    console.log(`✓ Created usa_sheet1_cities.csv with ${results.length} records`);
  }
}

matchSheet1().catch(err => {
  console.error('\n✗ ERROR:', err.message);
  process.exit(1);
});
