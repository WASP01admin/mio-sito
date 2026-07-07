#!/usr/bin/env node

/**
 * Geocode all associations without coordinates
 * Uses Nominatim (OpenStreetMap) - free, no API key needed
 * Rate limited to 1 request/sec (Nominatim requirement)
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERROR: Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Geocode a single address using Nominatim
async function geocodeAddress(address, city, country) {
  if (!address && !city) {
    return null;
  }

  // Build search query
  const parts = [address, city, country].filter((x) => x && x.trim());
  const query = parts.join(", ");

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "WASP-Association-Geocoder/1.0",
        },
      }
    );

    if (!response.ok) {
      console.error(`  Nominatim error: ${response.status}`);
      return null;
    }

    const results = await response.json();
    if (results.length === 0) {
      return null;
    }

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
    };
  } catch (error) {
    console.error(`  Geocoding error: ${error.message}`);
    return null;
  }
}

async function geocodeAssociations() {
  console.log("========================================");
  console.log("GEOCODING ASSOCIATIONS");
  console.log("========================================");
  console.log();

  // Step 1: Get all associations without coordinates
  console.log("1. Fetching associations without coordinates...");
  const { data: associations, error } = await supabase
    .from("associations")
    .select("id, name, city, address, country, lat, lng")
    .or("lat.is.null,lng.is.null")
    .limit(50000);

  if (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }

  const needsGeocode = associations.filter(
    (a) => !a.lat || !a.lng
  );

  console.log(`   Found ${needsGeocode.length} associations needing geocoding`);
  console.log();

  if (needsGeocode.length === 0) {
    console.log("✓ All associations already geocoded!");
    process.exit(0);
  }

  // Step 2: Geocode each association (with rate limiting)
  console.log(
    "2. Geocoding addresses (1 per second to respect Nominatim rate limit)..."
  );
  let success = 0;
  let failed = 0;
  const updates = [];

  for (let i = 0; i < needsGeocode.length; i++) {
    const assoc = needsGeocode[i];

    process.stdout.write(
      `\r   Progress: ${i + 1}/${needsGeocode.length} (${success} geocoded, ${failed} failed)`
    );

    const coords = await geocodeAddress(assoc.address, assoc.city, assoc.country);

    if (coords) {
      updates.push({
        id: assoc.id,
        lat: coords.lat,
        lng: coords.lng,
      });
      success++;
    } else {
      failed++;
    }

    // Rate limit: wait 1 second between requests
    if (i < needsGeocode.length - 1) {
      await sleep(1000);
    }
  }

  console.log(
    `\n   Geocoded: ${success} | Failed: ${failed}\n`
  );

  // Step 3: Update Supabase with coordinates
  console.log("3. Updating Supabase...");

  let updatedCount = 0;
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50);

    for (const update of batch) {
      const { error: updateError } = await supabase
        .from("associations")
        .update({ lat: update.lat, lng: update.lng })
        .eq("id", update.id);

      if (updateError) {
        console.error(`   ERROR updating ${update.id}: ${updateError.message}`);
      } else {
        updatedCount++;
      }
    }

    const progress = Math.min(updatedCount, updates.length);
    console.log(`   Updated: ${progress}/${updates.length}`);
  }

  console.log();
  console.log("========================================");
  console.log("GEOCODING COMPLETE");
  console.log("========================================");
  console.log(`✓ Successfully geocoded: ${updatedCount} associations`);
  console.log(`✗ Failed to geocode: ${failed} associations`);
  console.log();
  console.log("The map will now display all geocoded associations!");
}

geocodeAssociations().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
