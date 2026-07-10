#!/usr/bin/env node

/**
 * UPDATE CANADA COORDINATES
 * Merge geocoded lat/lng back into database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const updates = [
  { code: 'CAN0044', lat: 50.562809, lng: -111.892523 },
  { code: 'CAN0045', lat: 44.659892, lng: -63.542650 },
  { code: 'CAN0013', lat: 50.656007, lng: -102.075759 }
];

async function updateCoordinates() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  UPDATE CANADA COORDINATES                ║');
  console.log('║  (3 records)                              ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  let updated = 0;
  let failed = 0;

  for (const item of updates) {
    process.stdout.write(`Updating ${item.code}... `);

    const { error } = await supabase
      .from('associations')
      .update({ lat: item.lat, lng: item.lng })
      .eq('code', item.code)
      .eq('country', 'Canada');

    if (error) {
      console.log(`✗ Error: ${error.message}`);
      failed++;
    } else {
      console.log(`✓ ${item.lat.toFixed(6)}, ${item.lng.toFixed(6)}`);
      updated++;
    }
  }

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  UPDATE COMPLETE ✓                        ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  console.log(`Updated: ${updated}/3`);
  console.log(`Failed: ${failed}/3\n`);

  if (updated === 3) {
    console.log('✓ All Canada coordinates updated!\n');
  }
}

updateCoordinates().catch(err => {
  console.error('\n✗ ERROR:', err.message);
  process.exit(1);
});
