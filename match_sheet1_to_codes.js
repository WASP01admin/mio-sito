#!/usr/bin/env node

/**
 * MATCH SHEET1 ORGANIZATIONS TO DATABASE CODES
 * Read organization names from Sheet1.csv and find their codes in database
 */

const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function matchSheet1ToCodes() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  MATCH SHEET1 TO DATABASE CODES           ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Read Sheet1.csv
  const records = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream("C:\\Users\\robbu\\Downloads\\united_states_missing_coords - Sheet1.csv")
      .pipe(csv())
      .on('data', (data) => {
        const orgName = data.Organization?.trim();
        const city = data['City / Town (State)']?.trim();

        if (orgName && city && city !== '—' && data.Website !== 'Header Only') {
          records.push({ orgName, city });
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Found ${records.length} organizations with cities\n`);
  console.log('Matching organization names to database codes...\n');

  const codeMap = [];
  let matched = 0;
  let notFound = 0;

  // For each organization, find it in the database
  for (const record of records) {
    // Try to match by name (case-insensitive substring match)
    const { data: results } = await supabase
      .from('associations')
      .select('code, name, city')
      .eq('country', 'United States')
      .ilike('name', `%${record.orgName.substring(0, 20)}%`)
      .limit(5);

    if (results && results.length > 0) {
      // Take the first match (best match by name similarity)
      const match = results[0];

      // Clean up city name (remove state info in parentheses)
      const cleanCity = record.city.split('(')[0].trim();

      codeMap.push({
        code: match.code,
        city: cleanCity,
        orgName: record.orgName
      });

      matched++;
      if (matched % 20 === 0) {
        process.stdout.write(`  ✓ Matched ${matched}/${records.length}\r`);
      }
    } else {
      notFound++;
    }
  }

  console.log(`\n✓ Matched: ${matched}`);
  console.log(`✗ Not found: ${notFound}\n`);

  // Create CSV for geocoding
  const csvContent = 'code,city\n' +
    codeMap.map(m => `${m.code},${m.city}`).join('\n');

  fs.writeFileSync('usa_sheet1_cities.csv', csvContent);

  console.log(`✓ Created usa_sheet1_cities.csv with ${codeMap.length} records\n`);
}

matchSheet1ToCodes().catch(err => {
  console.error('\n✗ ERROR:', err.message);
  process.exit(1);
});
