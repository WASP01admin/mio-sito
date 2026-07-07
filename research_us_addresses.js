#!/usr/bin/env node

/**
 * Research addresses for 659 US +1 organizations using name + email + website
 * Exports a list for manual review and geocoding improvement
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { stringify } = require('csv-stringify/sync');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Extract domain from email (e.g., "shelter@rescuepets.org" -> "rescuepets.org")
function extractDomain(email) {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1].toLowerCase();
}

// Extract potential state/city hints from domain
function extractLocationHints(domain, name) {
  const hints = [];

  // Some common city/state abbreviations and codes in domains
  const stateMap = {
    'ca': 'California', 'tx': 'Texas', 'ny': 'New York', 'fl': 'Florida',
    'ga': 'Georgia', 'nc': 'North Carolina', 'il': 'Illinois', 'pa': 'Pennsylvania',
    'az': 'Arizona', 'co': 'Colorado', 'wa': 'Washington', 'or': 'Oregon',
    'mi': 'Michigan', 'oh': 'Ohio', 'ma': 'Massachusetts', 'nj': 'New Jersey',
    'va': 'Virginia', 'md': 'Maryland', 'mn': 'Minnesota', 'mo': 'Missouri',
  };

  if (domain) {
    // Check for state abbreviations in domain
    for (const [abbr, state] of Object.entries(stateMap)) {
      if (domain.includes(abbr)) {
        hints.push(`State hint: ${state}`);
        break;
      }
    }
  }

  // Check for city names in organization name (parentheses already extracted earlier)
  const cityMatch = name.match(/\(([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\)/);
  if (cityMatch) {
    hints.push(`Name hint: ${cityMatch[1]}`);
  }

  return hints.length > 0 ? hints.join(' | ') : '';
}

async function researchAddresses() {
  console.log('========================================');
  console.log('RESEARCHING ADDRESSES FOR 659 RECORDS');
  console.log('========================================');
  console.log();

  // Fetch all US +1 with no coordinates
  console.log('1. Fetching 659 problematic records...');
  const { data: records } = await supabase
    .from('associations')
    .select('id, name, city, email, website')
    .eq('country', 'US +1')
    .is('lat', null)
    .limit(50000);

  console.log(`   Found ${records.length} records`);
  console.log();

  // Build research CSV
  console.log('2. Building research spreadsheet...');
  const researchData = records.map(r => ({
    id: r.id,
    name: r.name,
    email: r.email || '',
    email_domain: extractDomain(r.email) || '',
    website: r.website || '',
    location_hints: extractLocationHints(extractDomain(r.email), r.name),
    research_notes: '',
    suggested_address: '',
    suggested_city: '',
    suggested_state: '',
  }));

  // Export to CSV
  const csv = stringify(researchData, {
    header: true,
  });

  const desktopPath = `${process.env.USERPROFILE}\\Desktop\\us_records_for_research.csv`;
  fs.writeFileSync(desktopPath, csv, 'utf-8');

  console.log('   ✓ Exported research CSV');
  console.log(`   Saved to: ${desktopPath}`);
  console.log();

  console.log('3. Summary:');
  console.log(`   Total records: ${records.length}`);

  const hasWebsite = records.filter(r => r.website).length;
  const hasEmail = records.filter(r => r.email).length;

  console.log(`   With website: ${hasWebsite}`);
  console.log(`   With email: ${hasEmail}`);
  console.log();

  console.log('========================================');
  console.log('RESEARCH SPREADSHEET READY');
  console.log('========================================');
  console.log();
  console.log('Next steps:');
  console.log('1. Open the CSV on your Desktop');
  console.log('2. For each record, research the address using:');
  console.log('   - Organization name (Google search)');
  console.log('   - Email domain / website');
  console.log('   - Location hints extracted from name/domain');
  console.log('3. Fill in: suggested_address, suggested_city, suggested_state');
  console.log('4. Once complete, I can re-geocode them all with the real addresses');
  console.log();
  console.log('Or send me the file and I can help with the research!');
}

researchAddresses().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
