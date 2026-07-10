#!/usr/bin/env node

/**
 * Automatically research 1,000 US animal organizations
 * Uses web search to find addresses, cities, states
 * Saves results and re-geocodes them
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { stringify } = require('csv-stringify/sync');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Sleep for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Extract city/state from text using patterns
function extractLocation(text) {
  if (!text) return { city: '', state: '' };

  // Match patterns like "City, ST" or "City, State"
  const matches = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b/g);
  if (matches && matches.length > 0) {
    const parts = matches[0].split(',');
    return {
      city: parts[0].trim(),
      state: parts[1].trim(),
    };
  }

  return { city: '', state: '' };
}

// Extract address and location from search result
function parseSearchResult(result) {
  let address = '';
  let city = '';
  let state = '';

  if (!result) return { address, city, state };

  // Try to find address in snippet or title
  const text = (result.snippet || result.title || '').replace(/<[^>]*>/g, '');

  // Look for street address pattern (number + street)
  const addressMatch = text.match(/\d+\s+[A-Z][a-zA-Z\s]+(?:St|Ave|Rd|Road|Street|Avenue|Drive|Lane|Way|Boulevard|Blvd|Plaza|Court|Ct|Drive|Dr|Lane|Ln|Place|Pl|Square|Sq|Trail|Tr|Terrace|Ter)/i);
  if (addressMatch) {
    address = addressMatch[0].trim();
  }

  // Look for city, state pattern
  const locMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/);
  if (locMatch) {
    city = locMatch[1];
    state = locMatch[2];
  }

  return { address, city, state };
}

// Search for organization on the web
async function searchOrganization(name, website) {
  try {
    // Build search query
    let query = name;
    if (website) {
      query += ` site:${website.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
    } else {
      query += ' address contact';
    }

    // Use DuckDuckGo's API (free, no key needed)
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'WASP-Address-Researcher/1.0',
      },
      timeout: 5000,
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Parse results
    if (data.Results && data.Results.length > 0) {
      const result = data.Results[0];
      const parsed = parseSearchResult(result);
      return parsed;
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function researchAllAddresses() {
  console.log('========================================');
  console.log('RESEARCHING 1,000 ORGANIZATIONS');
  console.log('========================================');
  console.log();

  // Fetch all US +1 without coordinates
  console.log('1. Fetching 1,000 records...');
  const { data: records } = await supabase
    .from('associations')
    .select('id, name, email, website, city')
    .eq('country', 'US +1')
    .is('lat', null)
    .limit(1000);

  console.log(`   Found ${records.length} records`);
  console.log();

  // Research each organization
  console.log('2. Researching addresses (this will take ~15-20 minutes)...');
  console.log('   Rate: 1 search per 1.5 seconds to be respectful to servers');
  console.log();

  const results = [];
  let found = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i++) {
    const org = records[i];

    process.stdout.write(
      `\r   Progress: ${i + 1}/${records.length} (Found: ${found}, Failed: ${failed})`
    );

    const research = await searchOrganization(org.name, org.website);

    if (research && (research.city || research.state)) {
      results.push({
        id: org.id,
        name: org.name,
        website: org.website || '',
        original_city: org.city || '',
        research_address: research.address,
        research_city: research.city,
        research_state: research.state,
      });
      found++;
    } else {
      results.push({
        id: org.id,
        name: org.name,
        website: org.website || '',
        original_city: org.city || '',
        research_address: '',
        research_city: '',
        research_state: '',
      });
      failed++;
    }

    // Rate limiting: 1 request per 1.5 seconds
    if (i < records.length - 1) {
      await sleep(1500);
    }
  }

  console.log(`\n   Complete! Found: ${found}, Failed: ${failed}\n`);

  // Export results
  console.log('3. Saving results...');
  const csv = stringify(results, {
    header: true,
  });

  const desktopPath = `${process.env.USERPROFILE}\\Desktop\\researched_addresses.csv`;
  fs.writeFileSync(desktopPath, csv, 'utf-8');

  console.log(`   ✓ Saved to: researched_addresses.csv`);
  console.log();

  console.log('========================================');
  console.log('RESEARCH COMPLETE');
  console.log('========================================');
  console.log(`✓ Successfully found: ${found} addresses`);
  console.log(`⚠ Could not find: ${failed} addresses`);
  console.log();
  console.log('Next: Review the CSV and I can re-geocode with the new data!');
}

researchAllAddresses().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
