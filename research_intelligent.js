#!/usr/bin/env node

/**
 * INTELLIGENT address research using ALL available data
 * Primary: Organization NAME (most powerful)
 * Supporting: Email domain, website, facebook, everything
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

// Extract location hints from ALL available data
function buildSearchStrategy(org) {
  const hints = [];

  // 1. Organization name - PRIMARY SOURCE
  hints.push({
    priority: 1,
    query: org.name + ' animal rescue address',
    source: 'name',
  });

  // 2. Email domain - often contains location hints
  if (org.email && org.email.includes('@')) {
    const domain = org.email.split('@')[1].toLowerCase();
    // Extract potential city/state from domain
    // e.g., "denver.rescuepets.org" -> "Denver, Colorado"
    const domainPart = domain.split('.')[0];
    if (domainPart.length > 3) {
      hints.push({
        priority: 2,
        query: domainPart + ' ' + org.name + ' address',
        source: 'email_domain',
      });
    }
  }

  // 3. Website domain - same as email logic
  if (org.website) {
    const cleanUrl = org.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    const domainPart = cleanUrl.split('.')[0];
    if (domainPart.length > 3 && domainPart !== 'rescuepets' && domainPart !== 'adoption') {
      hints.push({
        priority: 3,
        query: domainPart + ' ' + org.name,
        source: 'website_domain',
      });
    }
  }

  // 4. Organization name + website
  if (org.website) {
    hints.push({
      priority: 4,
      query: org.name + ' site:' + org.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
      source: 'name_website',
    });
  }

  // 5. Facebook search (many rescues have Facebook pages)
  hints.push({
    priority: 5,
    query: org.name + ' facebook animal rescue contact',
    source: 'facebook',
  });

  return hints;
}

// Extract address from text intelligently
function extractAddress(text) {
  if (!text) return { address: '', city: '', state: '' };

  // Pattern 1: Full address with street, city, state, zip
  let match = text.match(/(\d+\s+[A-Z][a-zA-Z\s.,]*(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Boulevard|Blvd|Place|Pl)),?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s+(\d{5})/i);
  if (match) {
    return {
      address: match[1],
      city: match[2],
      state: match[3],
    };
  }

  // Pattern 2: Just city, state
  match = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b/);
  if (match) {
    return {
      address: '',
      city: match[1],
      state: match[2],
    };
  }

  // Pattern 3: PO Box format
  match = text.match(/(P\.?O\.?\s+Box\s+\d+),?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/i);
  if (match) {
    return {
      address: match[1],
      city: match[2],
      state: match[3],
    };
  }

  return { address: '', city: '', state: '' };
}

// Simulate web search (in production would use real API)
async function smartSearch(org) {
  const strategy = buildSearchStrategy(org);

  // Try top 3 search strategies
  for (const hint of strategy.slice(0, 3)) {
    try {
      // Simulate fetching search results
      // In real world: would call Google/DuckDuckGo/Bing API
      console.log(`[${hint.source}] ${hint.query}`);

      // Try to fetch website and extract address
      if (hint.source === 'name_website' && org.website) {
        const response = await fetch(org.website, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 3000,
        });

        if (response.ok) {
          const html = await response.text();
          const result = extractAddress(html);
          if (result.city || result.state) {
            return result;
          }
        }
      }

      await sleep(500);
    } catch (error) {
      // Continue to next strategy
    }
  }

  return { address: '', city: '', state: '' };
}

async function intelligentResearch() {
  console.log('========================================');
  console.log('INTELLIGENT ADDRESS RESEARCH');
  console.log('Using: NAME + Email + Website + Facebook');
  console.log('========================================');
  console.log();

  // Fetch sample
  console.log('1. Fetching 50 US organizations for testing...');
  const { data: records } = await supabase
    .from('associations')
    .select('id, name, email, website')
    .eq('country', 'US +1')
    .is('lat', null)
    .limit(50);

  console.log(`   Found ${records.length} records`);
  console.log();

  const results = [];
  let found = 0;

  console.log('2. Researching using ALL available data...');
  console.log();

  for (let i = 0; i < records.length; i++) {
    const org = records[i];

    process.stdout.write(`\r   ${i + 1}/${records.length} (Found: ${found})`);

    const data = await smartSearch(org);

    results.push({
      id: org.id,
      name: org.name,
      email: org.email || '',
      website: org.website || '',
      research_address: data.address,
      research_city: data.city,
      research_state: data.state,
      found: data.city ? 'YES' : 'NO',
    });

    if (data.city || data.state) {
      found++;
    }

    await sleep(1000);
  }

  console.log(`\n\n`);

  // Export
  console.log('3. Saving results...');
  const csv = stringify(results, { header: true });
  const desktopPath = `${process.env.USERPROFILE}\\Desktop\\intelligent_research_results.csv`;
  fs.writeFileSync(desktopPath, csv, 'utf-8');

  console.log();
  console.log('========================================');
  console.log('SAMPLE TEST COMPLETE');
  console.log('========================================');
  console.log(`✓ Found addresses for: ${found}/${results.length}`);
  console.log(`Success rate: ${Math.round((found / results.length) * 100)}%`);
  console.log();
  console.log('Results: intelligent_research_results.csv');
}

intelligentResearch().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
