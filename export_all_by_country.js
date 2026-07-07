#!/usr/bin/env node

/**
 * EXPORT ALL ASSOCIATIONS BY COUNTRY
 * Consistent columns across all countries
 * Include ALL data (complete and incomplete)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EXPORT_DIR = path.join(__dirname, 'exports_by_country');

function escapeCSV(value) {
  if (!value) return '';
  value = String(value);
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function exportByCountry() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  COMPREHENSIVE COUNTRY-BY-COUNTRY EXPORT║');
  console.log('╚════════════════════════════════════════╝\n');

  // Create export directory
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }

  // Fetch ALL associations with pagination
  console.log('1. Fetching ALL associations from database...');
  let allRecords = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: pageData, error } = await supabase
      .from('associations')
      .select('name, address, lat, lng, email, website, facebook_url, code, city, country')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error(`ERROR: ${error.message}`);
      process.exit(1);
    }

    if (!pageData || pageData.length === 0) {
      hasMore = false;
    } else {
      allRecords = allRecords.concat(pageData);
      console.log(`   ✓ Fetched page ${page + 1}: ${pageData.length} records (Total so far: ${allRecords.length})`);
      page++;
    }
  }

  console.log(`\n   ✓ Retrieved ${allRecords.length} total records\n`);

  // Group by country
  console.log('2. Grouping by country...');
  const byCountry = {};

  allRecords?.forEach(record => {
    const country = record.country || 'Unknown';
    if (!byCountry[country]) {
      byCountry[country] = [];
    }
    byCountry[country].push(record);
  });

  console.log(`   ✓ Found ${Object.keys(byCountry).length} countries\n`);

  // Export each country
  console.log('3. Exporting to CSV files...\n');

  const stats = {};
  const countryList = Object.keys(byCountry).sort();

  for (const country of countryList) {
    const records = byCountry[country];
    const filename = `${country.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    const filepath = path.join(EXPORT_DIR, filename);

    // CSV header
    const header = ['Name', 'Address', 'Lat', 'Lon', 'Email', 'Website', 'Facebook', 'Extra1', 'Extra2'];
    const lines = [header.map(h => escapeCSV(h)).join(',')];

    // CSV rows
    let withCoords = 0;
    records.forEach(rec => {
      const row = [
        rec.name || '',
        rec.address || '',
        rec.lat || '',
        rec.lng || '',
        rec.email || '',
        rec.website || '',
        rec.facebook_url || '',
        rec.code || '',
        rec.city || ''
      ];
      lines.push(row.map(v => escapeCSV(v)).join(','));
      if (rec.lat && rec.lng) withCoords++;
    });

    // Write file
    fs.writeFileSync(filepath, lines.join('\n'), 'utf8');

    stats[country] = {
      total: records.length,
      withCoords: withCoords,
      percent: Math.round((withCoords / records.length) * 100)
    };

    console.log(`   ✓ ${country.padEnd(25)} ${records.length.toString().padStart(4)} records (${withCoords.toString().padStart(4)} with coords - ${stats[country].percent}%)`);
  }

  console.log();
  console.log('╔════════════════════════════════════════╗');
  console.log('║          EXPORT COMPLETE!              ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Summary
  console.log('📊 SUMMARY BY COUNTRY:\n');
  countryList.forEach(country => {
    const s = stats[country];
    console.log(`  ${country.padEnd(25)} ${s.total.toString().padStart(4)} | ${s.withCoords.toString().padStart(4)} coords (${s.percent.toString().padStart(3)}%)`);
  });

  const totalRecs = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
  const totalCoords = Object.values(stats).reduce((sum, s) => sum + s.withCoords, 0);
  const totalPercent = Math.round((totalCoords / totalRecs) * 100);

  console.log(`\n  ${'TOTAL'.padEnd(25)} ${totalRecs.toString().padStart(4)} | ${totalCoords.toString().padStart(4)} coords (${totalPercent.toString().padStart(3)}%)\n`);

  console.log(`📁 Files saved to: ${EXPORT_DIR}\n`);
  console.log('✅ Ready to import into Google Sheets!\n');
}

exportByCountry().catch(err => {
  console.error('FATAL ERROR:', err.message);
  process.exit(1);
});
