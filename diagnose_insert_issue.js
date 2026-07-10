#!/usr/bin/env node

/**
 * DIAGNOSE: Why are inserts not persisting?
 * Check RLS, permissions, and test a single insert
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
  console.log('========================================');
  console.log('DIAGNOSTIC: INSERT PERSISTENCE ISSUE');
  console.log('========================================\n');

  console.log('1. Current environment:');
  console.log(`   URL: ${SUPABASE_URL?.substring(0, 30)}...`);
  console.log(`   Key: ${SUPABASE_KEY?.substring(0, 20)}...`);
  console.log();

  console.log('2. Testing simple insert...');
  const testRecord = {
    code: 'TEST001',
    name: 'Test Organization - Diagnostic',
    city: 'Test City',
    country: 'USA',
    address: '123 Test St',
    lat: 40.7128,
    lng: -74.0060,
  };

  const { data: insertResult, error: insertError } = await supabase
    .from('associations')
    .insert([testRecord])
    .select();

  if (insertError) {
    console.log(`   ❌ INSERT FAILED: ${insertError.message}`);
    console.log(`   Error code: ${insertError.code}`);
    console.log(`   Details: ${JSON.stringify(insertError.details)}`);
  } else {
    console.log(`   ✅ INSERT SUCCESS`);
    console.log(`   Inserted: ${insertResult.length} record(s)`);

    // Verify it persisted
    console.log('\n3. Verifying persistence...');
    const { data: checkResult } = await supabase
      .from('associations')
      .select('*')
      .eq('code', 'TEST001');

    if (checkResult && checkResult.length > 0) {
      console.log(`   ✅ VERIFIED: Record found in database`);
      console.log(`   Name: ${checkResult[0].name}`);
      console.log(`   Coords: ${checkResult[0].lat}, ${checkResult[0].lng}`);

      // Clean up
      await supabase.from('associations').delete().eq('code', 'TEST001');
      console.log(`   ✅ Cleaned up test record`);
    } else {
      console.log(`   ❌ NOT FOUND: Record inserted but not readable`);
      console.log(`   This suggests RLS policy blocking SELECT after INSERT`);
    }
  }

  console.log('\n4. Checking table structure...');
  const { data: schema } = await supabase
    .from('associations')
    .select('*')
    .limit(1);

  if (schema && schema.length > 0) {
    console.log(`   ✅ Table accessible`);
    console.log(`   Columns: ${Object.keys(schema[0]).join(', ')}`);
  }

  console.log('\n========================================');
  console.log('DIAGNOSIS COMPLETE');
  console.log('========================================');
}

diagnose().catch(err => {
  console.error('FATAL ERROR:', err.message);
  process.exit(1);
});
