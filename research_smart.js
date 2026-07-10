#!/usr/bin/env node

/**
 * SMART address research - like Gemini
 * Strategy: Fetch websites directly + intelligent parsing + better search
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { stringify } = require('csv-stringify/sync');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch and extract address from website
async function extractFromWebsite(url) {
  if (!url) return null;

  try {
    // Normalize URL
    let fetchUrl = url;
    if (!fetchUrl.startsWith('http')) {
      fetchUrl = 'https://' + fetchUrl;
    }

    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 5000,
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Look for address patterns in common locations
    // Pattern: "Address: City, ST 12345" or similar
    const patterns = [
      /address[:\s]*([^<\n]*?(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln)\s+[^<\n]*?[A-Z]{2}\s+\d{5})/i,
      /(\d+\s+[A-Z][a-zA-Z\s]*(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln),?\s+[A-Z][a-z]+,\s*[A-Z]{2}\s+\d{5})/,
      /([A-Z][a-z]+,\s*[A-Z]{2}\s+\d{5})/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return {
          address: match[1].trim(),
          source: 'website',
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Extract city and state from text using regex
function extractCityState(text) {
  if (!text) return { city: '', state: '' };

  // Match "City, ST" pattern
  const match = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/);
  if (match) {
    return {
      city: match[1],
      state: match[2],
    };
  }

  return { city: '', state: '' };
}

async function smartResearch() {
  console.log('========================================');
  console.log('SMART ADDRESS RESEARCH');
  console.log('========================================');
  console.log();

  // Fetch all US +1 without coordinates
  console.log('1. Fetching 1,000 US organizations...');
  const { data: records } = await supabase
    .from('associations')
    .select('id, name, email, website')
    .eq('country', 'US +1')
    .is('lat', null)
    .limit(100); // START WITH 100 FOR TESTING

  console.log(`   Found ${records.length} records`);
  console.log('   Testing with 100 records first...');
  console.log();

  const results = [];
  let found = 0;
  let failed = 0;

  console.log('2. Researching websites & addresses...');
  console.log();

  for (let i = 0; i < records.length; i++) {
    const org = records[i];

    process.stdout.write(
      `\r   Progress: ${i + 1}/${records.length} (Found: ${found}, Failed: ${failed})`
    );

    let address = '';
    let city = '';
    let state = '';

    // Try website first
    if (org.website) {
      const webData = await extractFromWebsite(org.website);
      if (webData && webData.address) {
        address = webData.address;
        const locData = extractCityState(address);
        city = locData.city;
        state = locData.state;
        found++;
      }
    }

    // If no luck with website, try organization name
    if (!address && org.name) {
      // Extract city from parentheses in name like we did before
      const match = org.name.match(/\(([^)]+)\)$/);
      if (match) {
        const potential = match[1];
        city = potential;
        state = ''; // Would need more work to extract state
      }
    }

    if (!address && !city) {
      failed++;
    }

    results.push({
      id: org.id,
      name: org.name,
      website: org.website || '',
      email: org.email || '',
      found_address: address,
      found_city: city,
      found_state: state,
    });

    // Be nice to servers - 2 second delay
    if (i < records.length - 1) {
      await sleep(2000);
    }
  }

  console.log(`\n   Complete!\n`);

  // Export results
  console.log('3. Saving results...');
  const csv = stringify(results, { header: true });
  const desktopPath = `${process.env.USERPROFILE}\\Desktop\\smart_research_results.csv`;
  fs.writeFileSync(desktopPath, csv, 'utf-8');

  console.log();
  console.log('========================================');
  console.log('SAMPLE RESEARCH COMPLETE');
  console.log('========================================');
  console.log(`✓ Found: ${found}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Success rate: ${Math.round((found / results.length) * 100)}%`);
  console.log();
  console.log('File: smart_research_results.csv on Desktop');
  console.log();
  console.log('If results look good, we can scale to all 1,000!');
}

smartResearch().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
