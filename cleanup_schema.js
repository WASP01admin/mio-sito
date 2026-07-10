#!/usr/bin/env node

/**
 * CLEANUP DATABASE SCHEMA
 * Remove extra columns, restore pure 14-column universal structure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function cleanupSchema() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  CLEANUP DATABASE SCHEMA                  ║');
  console.log('║  Remove extra columns, restore purity     ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Columns to remove (not part of 14-column universal schema)
  const columnsToRemove = [
    'password_hash',      // ✗ Auth field (shouldn't be here)
    'last_login',         // ✗ Auth field (shouldn't be here)
    'notes_1',            // ✗ Not in universal schema
    'notes_2',            // ✗ Not in universal schema
    'facebook_url',       // ✗ Not in universal schema
    'saved_map_lat',      // ✗ User preference (shouldn't be here)
    'saved_map_lng',      // ✗ User preference (shouldn't be here)
    'saved_map_zoom'      // ✗ User preference (shouldn't be here)
  ];

  console.log(`Columns to remove: ${columnsToRemove.length}\n`);
  columnsToRemove.forEach(col => {
    console.log(`  ✗ ${col}`);
  });

  console.log(`\nKeeping universal 14-column schema:`);
  const keepColumns = [
    'code', 'name', 'country', 'city', 'address', 'website', 'email', 'phone',
    'lat', 'lng', 'instagram', 'email_secondary', 'postal_code', 'contact_person', 'extra_details'
  ];
  keepColumns.forEach(col => {
    console.log(`  ✓ ${col}`);
  });

  console.log(`\nAlso keeping system columns:`);
  console.log(`  ✓ id (Supabase identifier)`);
  console.log(`  ✓ created_at (timestamp)`);
  console.log(`  ✓ updated_at (timestamp)\n`);

  // Execute DROP COLUMN for each extra column
  console.log('Executing cleanup...\n');

  for (const col of columnsToRemove) {
    try {
      const { error } = await supabase.rpc('drop_column_if_exists', {
        table_name: 'associations',
        column_name: col
      });

      if (error && error.message.includes('does not exist')) {
        console.log(`✓ ${col} (already removed or never existed)`);
      } else if (error) {
        console.log(`✗ ${col} (error: ${error.message})`);
      } else {
        console.log(`✓ ${col} (removed)`);
      }
    } catch (err) {
      // RPC might not exist, try raw SQL instead
      console.log(`⚠ ${col} (will need manual removal via SQL)`);
    }
  }

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  CLEANUP INSTRUCTIONS                    ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  console.log(`Execute this SQL in Supabase SQL Editor to remove extra columns:\n`);

  const sqlStatements = columnsToRemove.map(col =>
    `ALTER TABLE associations DROP COLUMN IF EXISTS ${col};`
  ).join('\n');

  console.log(sqlStatements);

  console.log(`\n\nTo verify schema after cleanup, run this query:\n`);
  console.log(`SELECT column_name FROM information_schema.columns
WHERE table_name = 'associations'
ORDER BY ordinal_position;\n`);
}

cleanupSchema().catch(err => {
  console.error('✗ ERROR:', err.message);
  process.exit(1);
});
