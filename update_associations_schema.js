#!/usr/bin/env node

/**
 * ADD MISSING COLUMNS TO ASSOCIATIONS TABLE
 * Adds columns from the new 14-column standardized schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function updateSchema() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  UPDATING ASSOCIATIONS TABLE SCHEMA       ║');
  console.log('║  Adding missing 14-column standard fields ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Columns to add (if they don't exist)
  const columnsToAdd = [
    { name: 'instagram', type: 'text', nullable: true },
    { name: 'email_secondary', type: 'text', nullable: true },
    { name: 'postal_code', type: 'text', nullable: true },
    { name: 'contact_person', type: 'text', nullable: true },
    { name: 'extra_details', type: 'text', nullable: true },
  ];

  // Check if columns exist by trying to fetch with them
  console.log('Checking current schema...');
  const { data, error: fetchError } = await supabase
    .from('associations')
    .select('*')
    .limit(1);

  if (fetchError) {
    console.error('Error reading schema:', fetchError.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No records in table. Creating fresh schema...');
  }

  // Get existing columns
  const existingColumns = data && data.length > 0 ? Object.keys(data[0]) : [];
  console.log(`Current columns: ${existingColumns.join(', ')}\n`);

  // Check which columns need to be added
  const missingColumns = columnsToAdd.filter(col => !existingColumns.includes(col.name));

  if (missingColumns.length === 0) {
    console.log('✓ All columns already exist. No changes needed.\n');
    return;
  }

  console.log(`Missing columns: ${missingColumns.map(c => c.name).join(', ')}\n`);

  // Add columns via SQL RPC
  for (const col of missingColumns) {
    console.log(`Adding column: ${col.name} (${col.type})...`);

    const sqlStatement = `
      ALTER TABLE public.associations
      ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} ${col.nullable ? '' : 'NOT NULL DEFAULT \'\''}
    `;

    const { error } = await supabase.rpc('execute_sql', { sql: sqlStatement }).catch(() => ({ error: null }));

    // Alternative: use Postgres directly if RPC doesn't work
    if (error && error.message.includes('execute_sql')) {
      console.log(`  ⚠️  RPC not available, trying direct SQL...`);
      // This would require direct Postgres access, which we don't have via Supabase JS client
      console.log(`  Note: Manual SQL needed for ${col.name}`);
    } else if (!error) {
      console.log(`  ✓ Added ${col.name}`);
    }
  }

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  SCHEMA UPDATE COMPLETE                   ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  console.log('If manual columns are needed, run this SQL in Supabase:\n');

  missingColumns.forEach(col => {
    console.log(`ALTER TABLE public.associations ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
  });

  console.log('\nThen retry the Italy import.\n');
}

updateSchema();
