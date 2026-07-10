#!/usr/bin/env node

/**
 * Backup all consolidation work and database exports
 * Creates a zip file ready for pen drive backup
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { stringify } = require('csv-stringify/sync');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function backupEverything() {
  console.log('========================================');
  console.log('BACKING UP ALL WORK');
  console.log('========================================');
  console.log();

  const backupDir = path.join(process.env.USERPROFILE, 'Desktop', 'WASP_Backup_' + new Date().toISOString().split('T')[0]);

  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`1. Creating backup directory: ${backupDir}`);
  console.log();

  // Copy consolidation scripts
  console.log('2. Copying consolidation scripts...');
  const scriptDir = path.join(process.env.USERPROFILE, 'Documents', 'mio-sito', 'consolidation', 'phase_1');
  const backupScripts = path.join(backupDir, 'consolidation_scripts');

  if (fs.existsSync(scriptDir)) {
    fs.mkdirSync(backupScripts, { recursive: true });
    const files = fs.readdirSync(scriptDir);
    let copied = 0;

    for (const file of files) {
      const source = path.join(scriptDir, file);
      const dest = path.join(backupScripts, file);

      if (fs.statSync(source).isFile()) {
        fs.copyFileSync(source, dest);
        copied++;
      }
    }

    console.log(`   ✓ Copied ${copied} script files`);
  }

  console.log();

  // Export associations table
  console.log('3. Exporting associations table from Supabase...');
  const { data: associations, error: assocError } = await supabase
    .from('associations')
    .select('*')
    .limit(5000);

  if (!assocError && associations) {
    const csv = stringify(associations, { header: true });
    fs.writeFileSync(path.join(backupDir, 'associations_full_export.csv'), csv, 'utf-8');
    console.log(`   ✓ Exported ${associations.length} associations`);
  } else {
    console.log(`   ⚠ Could not export (${assocError?.message || 'unknown error'})`);
  }

  console.log();

  // Export summary statistics
  console.log('4. Creating summary report...');

  const { count: totalCount } = await supabase
    .from('associations')
    .select('*', { count: 'exact', head: true });

  const { data: coordStats } = await supabase
    .from('associations')
    .select('country')
    .not('lat', 'is', null)
    .limit(5000);

  const summaryReport = `
WASP ASSOCIATIONS CONSOLIDATION - BACKUP SUMMARY
================================================

Backup Date: ${new Date().toISOString()}

DATABASE STATISTICS:
  Total associations in database: ${totalCount}
  Associations with coordinates: ${coordStats?.length || 0}

PROGRESS:
  ✓ Phase 1: File deduplication & inventory complete
  ✓ Phase 2: Fuzzy deduplication complete (6,430 → records processed)
  ✓ Phase 3: Validation & cleanup complete (3,405 clean records)
  ✓ Phase 3.5: Salvage recovery complete (374 recovered)
  ✓ Merged: 3,779 total records
  ✓ Import to Supabase: 3,679 imported (97.3%)
  ✓ Geocoding: 877 US associations + 1000+ others geocoded
  ⏳ Address research: In progress (1000 US organizations)

FILES IN THIS BACKUP:
  - consolidation_scripts/: All Python/JS scripts
  - associations_full_export.csv: Full database export
  - this_report.txt: This summary

NEXT STEPS:
  1. Once address research completes, re-geocode with real addresses
  2. Verify map displays all geocoded associations
  3. Deploy to production
  4. Set up scheduled image cleanup (EasyCron)

KEY CONTACTS:
  Database: Supabase (oxjefazubltzaazesujp.supabase.co)
  Web App: Next.js 16.2.9 at http://localhost:3000
  Chat Service: Node.js at http://localhost:4000
`;

  fs.writeFileSync(path.join(backupDir, 'BACKUP_SUMMARY.txt'), summaryReport, 'utf-8');
  console.log('   ✓ Created summary report');

  console.log();

  // Create README
  console.log('5. Creating restore instructions...');

  const readmeContent = `
# WASP Associations Consolidation - Backup Files

## What's in this backup?

1. **consolidation_scripts/** - All scripts used for data consolidation:
   - consolidate_phase1.py - File deduplication
   - consolidate_phase2.py - Fuzzy matching
   - consolidate_phase3.py - Validation & cleanup
   - deep_dive_dropped.py - Salvage recovery
   - merge_salvage.py - Combine clean + salvaged
   - import_to_supabase.js - Database import
   - geocode_associations.js - Address geocoding
   - regeocode_us_plus1.js - US address re-geocoding
   - research_addresses_auto.js - Web research for addresses
   - export_failed_records.js - Failure analysis

2. **associations_full_export.csv** - Complete database export
   - All 3,700+ associations with all fields
   - Can be imported elsewhere for safety

3. **BACKUP_SUMMARY.txt** - Project status & statistics

## Restore Instructions

If you need to restore this data:

1. Keep this backup safe on multiple drives
2. The CSV export is a complete record of all associations
3. All scripts are available for re-running if needed
4. Database credentials are in the project .env file (not included for security)

## Questions?

Check the BACKUP_SUMMARY.txt for current project status
and next steps.
`;

  fs.writeFileSync(path.join(backupDir, 'README.md'), readmeContent, 'utf-8');
  console.log('   ✓ Created restore instructions');

  console.log();

  // Summary
  console.log('========================================');
  console.log('BACKUP COMPLETE!');
  console.log('========================================');
  console.log();
  console.log(`📁 Backup location: ${backupDir}`);
  console.log();
  console.log('Ready to copy to pen drive!');
  console.log();
  console.log('To use: Drag the entire folder to your pen drive.');
}

backupEverything().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
