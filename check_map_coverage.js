#!/usr/bin/env node

/**
 * CHECK MAP COVERAGE
 * How many associations have coordinates (ON MAP)?
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkMapCoverage() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  MAP COVERAGE ANALYSIS                    ║');
  console.log('║  How many associations have coordinates?  ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  try {
    // Fetch ALL records with pagination
    console.log('Fetching all records from database...\n');
    let allData = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('associations')
        .select('country, lat, lng')
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      if (!data || data.length === 0) break;

      allData = allData.concat(data);
      console.log(`  ✓ Fetched batch: ${data.length} records (total: ${allData.length})`);

      if (data.length < pageSize) break;

      offset += pageSize;
    }

    const data = allData;
    console.log(`\n✓ Retrieved ${data.length} total records\n`);

    // Count by country
    const countByCountry = {};
    const onMapByCountry = {};

    data.forEach(record => {
      const country = record.country || 'Unknown';

      if (!countByCountry[country]) {
        countByCountry[country] = 0;
        onMapByCountry[country] = 0;
      }

      countByCountry[country]++;

      if (record.lat && record.lng) {
        onMapByCountry[country]++;
      }
    });

    // Sort by count
    const countries = Object.keys(countByCountry).sort((a, b) => countByCountry[b] - countByCountry[a]);

    console.log('Country                  Total    On Map    Coverage');
    console.log('─────────────────────────────────────────────────────');

    let totalRecords = 0;
    let totalOnMap = 0;

    countries.forEach(country => {
      const total = countByCountry[country];
      const onMap = onMapByCountry[country];
      const coverage = total > 0 ? ((onMap / total) * 100).toFixed(1) : '0.0';

      totalRecords += total;
      totalOnMap += onMap;

      console.log(
        `${country.padEnd(24)} ${String(total).padStart(5)}    ${String(onMap).padStart(5)}     ${coverage.padStart(5)}%`
      );
    });

    console.log('─────────────────────────────────────────────────────');
    const totalCoverage = totalRecords > 0 ? ((totalOnMap / totalRecords) * 100).toFixed(1) : '0.0';
    console.log(
      `${'TOTAL'.padEnd(24)} ${String(totalRecords).padStart(5)}    ${String(totalOnMap).padStart(5)}     ${totalCoverage.padStart(5)}%`
    );

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log(`║  MAP READY: ${String(totalOnMap).padStart(5)} / ${String(totalRecords).padStart(5)} (${totalCoverage}%)      ║`);
    console.log('╚═══════════════════════════════════════════╝\n');

  } catch (err) {
    console.error('\n✗ ERROR:', err.message);
    process.exit(1);
  }
}

checkMapCoverage();
