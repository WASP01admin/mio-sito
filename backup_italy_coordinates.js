#!/usr/bin/env node

/**
 * BACKUP ITALY COORDINATES
 * Export all current Italy records with their manually-added lat/lng
 * Before re-importing with new standardized format
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function backupItalyCoordinates() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  BACKUP ITALY COORDINATES                 ║');
  console.log('║  (Safe extraction before re-import)       ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  try {
    // Fetch ALL Italy records (with pagination to handle 1000+ limit)
    console.log('Fetching current Italy records from database...');
    let allRecords = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('associations')
        .select('code, name, lat, lng')
        .eq('country', 'Italy')
        .range(offset, offset + pageSize - 1);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        break;
      }

      allRecords = allRecords.concat(data);
      console.log(`  ✓ Fetched batch: ${data.length} records (total: ${allRecords.length})`);

      if (data.length < pageSize) {
        break;
      }

      offset += pageSize;
    }

    const data = allRecords;

    if (data.length === 0) {
      console.log('⚠️  No Italy records found in database');
      process.exit(0);
    }

    console.log(`\n✓ Retrieved ${data.length} Italy records total\n`);

    // Count records with coordinates
    const withCoords = data.filter(r => r.lat && r.lng);
    const withoutCoords = data.length - withCoords.length;

    console.log(`Records breakdown:`);
    console.log(`  • With coordinates (lat + lng): ${withCoords.length}`);
    console.log(`  • Without coordinates: ${withoutCoords.length}\n`);

    // Export to CSV
    const outputPath = 'italy_coordinates_backup.csv';
    const csvLines = ['code,name,lat,lng'];

    data.forEach(record => {
      const lat = record.lat || '';
      const lng = record.lng || '';
      const name = record.name ? `"${record.name.replace(/"/g, '""')}"` : '';
      csvLines.push(`${record.code},${name},${lat},${lng}`);
    });

    fs.writeFileSync(outputPath, csvLines.join('\n'));
    console.log(`✓ Backed up to: ${outputPath}`);
    console.log(`✓ Contains: ${data.length} records with code, name, lat, lng\n`);

    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  BACKUP COMPLETE ✓                        ║');
    console.log('╚═══════════════════════════════════════════╝\n');
    console.log('Safe to proceed with re-import.');
    console.log('Coordinates will be merged back after new import.\n');

  } catch (err) {
    console.error('\n✗ ERROR:', err.message);
    process.exit(1);
  }
}

backupItalyCoordinates();
