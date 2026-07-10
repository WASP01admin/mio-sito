#!/usr/bin/env node

/**
 * CHECK WHAT THE MAP API IS RETURNING
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkMapApi() {
  console.log('Checking what map API will return for associations...\n');

  // This is what the /api/maps/markers endpoint does
  const { data: markers, error } = await supabase
    .from('associations')
    .select('id, name, website, lat, lng, city, address')
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Markers with coordinates: ${markers?.length || 0}\n`);

  // Group by country
  const byCountry = new Map();
  markers?.forEach(m => {
    // We don't have country in this query, so let's check another way
  });

  // Get the full picture
  const { data: all } = await supabase
    .from('associations')
    .select('id, country, lat, lng');

  const withCoords = all?.filter(r => r.lat && r.lng) || [];

  const byCountryWithCoords = new Map();
  withCoords.forEach(r => {
    const c = r.country || 'NULL';
    byCountryWithCoords.set(c, (byCountryWithCoords.get(c) ?? 0) + 1);
  });

  console.log('Associations WITH coordinates:');
  byCountryWithCoords.forEach((count, country) => {
    console.log(`  ${country}: ${count}`);
  });

  console.log(`\nTotal with coordinates: ${withCoords.length}`);
  console.log(`Total in DB: ${all?.length || 0}`);

  // Check if there are non-Italy records with coordinates
  const nonItaly = withCoords.filter(r => r.country !== 'Italy');
  console.log(`\nNon-Italy records with coordinates: ${nonItaly.length}`);
  if (nonItaly.length > 0) {
    console.log('⚠️  This explains the map discrepancy!\n');
    const nonItalyCountries = new Map();
    nonItaly.forEach(r => {
      const c = r.country || 'NULL';
      nonItalyCountries.set(c, (nonItalyCountries.get(c) ?? 0) + 1);
    });
    console.log('Non-Italy countries with coordinates:');
    nonItalyCountries.forEach((count, country) => {
      console.log(`  ${country}: ${count}`);
    });
  }
}

checkMapApi().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
