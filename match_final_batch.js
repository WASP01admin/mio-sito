#!/usr/bin/env node

/**
 * MATCH FINAL BATCH TO DATABASE CODES
 * Read org names + cities from final batch, match to real database codes
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Parse CSV respecting quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

async function matchFinalBatch() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  MATCH FINAL BATCH TO DB CODES            ║');
  console.log('║  WASP IS FAIR AND DEMOCRATIC              ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Read CSV
  const filePath = 'C:\\Users\\robbu\\Downloads\\missing_coordinates - Sheet1.csv';
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 3) continue;

    const parts = parseCSVLine(line);
    if (parts.length < 2) continue;

    const orgName = parts[0].replace(/^"/, '').replace(/"$/, '').trim();
    const cityRaw = parts[1].replace(/^"/, '').replace(/"$/, '').trim();

    if (!orgName || !cityRaw) continue;

    // Extract just city name (remove province code in parentheses)
    const city = cityRaw.split('(')[0].trim();

    if (city.length > 2) {
      records.push({ orgName, city });
    }
  }

  console.log(`Found ${records.length} organizations from final batch\n`);
  console.log('Matching to database codes...\n');

  const matched = [];
  let found = 0;
  let notFound = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    try {
      // Try substring match
      const searchTerm = record.orgName.substring(0, 30);

      const { data } = await supabase
        .from('associations')
        .select('code, name, country')
        .ilike('name', `%${searchTerm}%`)
        .limit(5);

      let match = null;

      if (data && data.length > 0) {
        // Find best match
        match = data.find(r =>
          r.name.toLowerCase().includes(record.orgName.toLowerCase()) ||
          record.orgName.toLowerCase().includes(r.name.toLowerCase())
        );

        if (!match) match = data[0];
      }

      if (match) {
        matched.push({
          code: match.code,
          orgName: record.orgName,
          city: record.city,
          country: match.country
        });
        found++;
      } else {
        notFound++;
      }

      if ((i + 1) % 100 === 0) {
        process.stdout.write(`  Processed: ${i + 1}/${records.length} (${found} matched)\r`);
      }
    } catch (err) {
      notFound++;
    }
  }

  console.log(`\n✓ Matched ${found} organizations`);
  console.log(`✗ Not found: ${notFound}\n`);

  // Group by country
  const byCountry = {};
  matched.forEach(m => {
    byCountry[m.country] = (byCountry[m.country] || 0) + 1;
  });

  console.log('Matched by country:');
  Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, count]) => {
      console.log(`  ${country.padEnd(20)} ${count}`);
    });

  // Write CSV with real codes + cities
  if (matched.length > 0) {
    const csv = 'code,city\n' +
      matched.map(m => `${m.code},${m.city}`).join('\n');

    fs.writeFileSync('final_batch_matched_cities.csv', csv);
    console.log(`\n✓ Created final_batch_matched_cities.csv with ${matched.length} records`);
    console.log(`  (Ready for geocoding)\n`);
  }
}

matchFinalBatch().catch(err => {
  console.error('\n✗ ERROR:', err.message);
  process.exit(1);
});
