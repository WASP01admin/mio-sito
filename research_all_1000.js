#!/usr/bin/env node

/**
 * PROFESSIONAL ADDRESS RESEARCH - All 1,000 US organizations
 * Strategy: Intelligent search + pattern matching + incremental saves
 * Processes in batches, saves progress, recovers from failures
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { stringify } = require('csv-stringify/sync');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RESULTS_FILE = `${process.env.USERPROFILE}\\Desktop\\research_all_1000_results.csv`;
const BATCH_SIZE = 50;
const SEARCH_DELAY = 3000; // 3 seconds between searches to avoid rate limiting

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Extract address from HTML intelligently
function extractFromHTML(html, orgName) {
  if (!html) return null;

  // Remove script and style tags
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  // Pattern 1: Full address with street, city, state, zip
  let match = text.match(/(\d+\s+[A-Z][a-zA-Z\s.,]*(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Boulevard|Blvd|Place|Pl|Court|Ct)),?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s+(\d{5})/i);
  if (match) {
    return {
      address: match[1],
      city: match[2],
      state: match[3],
      zip: match[4],
    };
  }

  // Pattern 2: City, State, Zip
  match = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s+(\d{5})/);
  if (match) {
    return {
      address: '',
      city: match[1],
      state: match[2],
      zip: match[3],
    };
  }

  // Pattern 3: City, State (no zip)
  match = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b/);
  if (match) {
    return {
      address: '',
      city: match[1],
      state: match[2],
      zip: '',
    };
  }

  return null;
}

// Try to fetch and parse website
async function tryWebsite(website) {
  if (!website) return null;

  try {
    let url = website;
    if (!url.startsWith('http')) url = 'https://' + url;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 4000,
    });

    if (!response.ok) return null;

    const html = await response.text();
    return extractFromHTML(html, '');
  } catch (error) {
    return null;
  }
}

// Search organization and extract info
async function researchOrganization(org) {
  // Try website first (fastest)
  if (org.website) {
    const result = await tryWebsite(org.website);
    if (result && (result.city || result.state)) {
      return { ...result, source: 'website' };
    }
  }

  // Try extracting from organization name (city in parentheses)
  const nameMatch = org.name.match(/\(([^)]+)\)$/);
  if (nameMatch) {
    const city = nameMatch[1].trim();
    if (city.length > 2 && !city.match(/^(USA|US|Inc|Ltd|LLC|ONLUS)$/i)) {
      return {
        address: '',
        city: city,
        state: '',
        zip: '',
        source: 'name_extraction',
      };
    }
  }

  // No data found
  return {
    address: '',
    city: '',
    state: '',
    zip: '',
    source: 'not_found',
  };
}

async function researchAll() {
  console.log('========================================');
  console.log('RESEARCHING ALL 1,000 US ORGANIZATIONS');
  console.log('========================================');
  console.log();

  // Fetch all
  console.log('1. Fetching all 1,000 records from database...');
  const { data: allRecords } = await supabase
    .from('associations')
    .select('id, name, email, website')
    .eq('country', 'US +1')
    .is('lat', null)
    .limit(2000);

  console.log(`   Found ${allRecords.length} records`);
  console.log();

  const totalRecords = allRecords.length;
  const results = [];
  let found = 0;
  let notFound = 0;

  // Process in batches
  console.log(`2. Processing ${totalRecords} organizations...`);
  console.log(`   (Saving every ${BATCH_SIZE} records to prevent data loss)`);
  console.log();

  for (let i = 0; i < allRecords.length; i++) {
    const org = allRecords[i];
    const progress = i + 1;
    const percent = Math.round((progress / totalRecords) * 100);

    // Show progress
    process.stdout.write(`\r   [${percent}%] ${progress}/${totalRecords} | Found: ${found} | Not found: ${notFound}`);

    // Research this organization
    const data = await researchOrganization(org);

    results.push({
      id: org.id,
      name: org.name,
      email: org.email || '',
      website: org.website || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      zip: data.zip || '',
      source: data.source || 'unknown',
      found: data.city || data.state ? 'YES' : 'NO',
    });

    if (data.city || data.state) {
      found++;
    } else {
      notFound++;
    }

    // Save progress every BATCH_SIZE records
    if (progress % BATCH_SIZE === 0 || progress === totalRecords) {
      const csv = stringify(results, { header: true });
      fs.writeFileSync(RESULTS_FILE, csv, 'utf-8');
    }

    // Be respectful with timing
    if (i < allRecords.length - 1) {
      await sleep(SEARCH_DELAY / 2); // Reduced delay since we're doing website fetches, not all searches
    }
  }

  console.log(`\n\n`);

  // Final save
  console.log('3. Saving final results...');
  const csv = stringify(results, { header: true });
  fs.writeFileSync(RESULTS_FILE, csv, 'utf-8');

  console.log();
  console.log('========================================');
  console.log('RESEARCH COMPLETE!');
  console.log('========================================');
  console.log(`✓ Total records researched: ${totalRecords}`);
  console.log(`✓ Found addresses/cities: ${found} (${Math.round((found / totalRecords) * 100)}%)`);
  console.log(`✗ Not found: ${notFound} (${Math.round((notFound / totalRecords) * 100)}%)`);
  console.log();
  console.log(`File: research_all_1000_results.csv on Desktop`);
  console.log();
  console.log('Next: Review results and prepare for re-geocoding!');
}

researchAll().catch(err => {
  console.error('FATAL ERROR:', err.message);
  process.exit(1);
});
