#!/usr/bin/env node

/**
 * MATCH GEMINI USA DATA TO ACTUAL DATABASE CODES
 * Read org names + cities from Gemini, match to real database codes
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

async function matchGeminiToCodes() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  MATCH GEMINI USA DATA TO DB CODES        ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Read CSV
  const filePath = 'C:\\Users\\robbu\\Downloads\\united_states_missing_coords - USA with cities.csv';
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = parseCSVLine(line);
    if (parts.length < 3) continue;

    const orgName = parts[0];
    const city = parts[2].replace(/^["']|["']$/g, '').trim();

    if (!orgName || !city || city === '—') continue;

    records.push({ orgName, city });
  }

  console.log(`Found ${records.length} organizations from Gemini\n`);
  console.log('Matching to database codes (this will take a while)...\n');

  const matched = [];
  let found = 0;
  let notFound = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    try {
      // Try exact match first
      let { data } = await supabase
        .from('associations')
        .select('code, name')
        .eq('country', 'United States')
        .ilike('name', `%${record.orgName}%`)
        .limit(3);

      let match = null;

      if (data && data.length > 0) {
        // Try to find exact or very close match
        match = data.find(r =>
          r.name.toLowerCase().includes(record.orgName.toLowerCase()) ||
          record.orgName.toLowerCase().includes(r.name.toLowerCase())
        );

        // If no close match, take the first
        if (!match) match = data[0];
      }

      if (match) {
        matched.push({
          code: match.code,
          orgName: record.orgName,
          city: record.city.split('/')[0].split('(')[0].trim()
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

  // Write CSV with real codes + cities
  if (matched.length > 0) {
    const csv = 'code,city\n' +
      matched.map(m => `${m.code},${m.city}`).join('\n');

    fs.writeFileSync('usa_gemini_matched_cities.csv', csv);
    console.log(`✓ Created usa_gemini_matched_cities.csv with ${matched.length} records`);
    console.log(`  (Ready for geocoding)\n`);
  }
}

matchGeminiToCodes().catch(err => {
  console.error('\n✗ ERROR:', err.message);
  process.exit(1);
});
