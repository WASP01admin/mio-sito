const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const url = 'https://oxjefazubltzaazesujp.supabase.co';
const key = 'sb_secret_jAyDMKXAzzANL7o8Cc_d3A_Ywt_4Y1e';
const admin = createClient(url, key);

// Simple CSV parser
function parseCSV(csv) {
  const lines = csv.split('\n');
  const headers = lines[0].split('","').map(h => h.replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cells = lines[i].split('","').map(c => c.replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

const csv = fs.readFileSync('./sheet.csv', 'utf-8');
const records = parseCSV(csv);

// Filter valid associations
const associations = records.filter(r =>
  r['NOME ASSOCIAZIONE'] &&
  !r['NOME ASSOCIAZIONE'].startsWith('──') &&
  r['INDIRIZZO'] &&
  r['INDIRIZZO'].trim()
);

console.log(`📍 Found ${associations.length} associations to geocode...\n`);

async function geocode(address, city) {
  try {
    const query = `${address}, ${city}, Italy`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'WASP/1.0' } }
    );
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (e) {
    console.error(`  ❌ ${address}:`, e.message);
  }
  return null;
}

async function load() {
  const toInsert = [];
  const usedCodes = new Set();

  for (let i = 0; i < associations.length; i++) {
    const a = associations[i];
    const coords = await geocode(a['INDIRIZZO'], a['LOCALITÀ']);

    if (coords) {
      // Generate unique 7-char code
      const words = a['NOME ASSOCIAZIONE'].split(' ');
      let code = words.map(w => w[0]).join('').toUpperCase().substring(0, 7);
      if (code.length < 3) {
        code = a['NOME ASSOCIAZIONE'].substring(0, 7).toUpperCase().replace(/[^\w]/g, '');
      }
      // Add counter if code already used
      let counter = 0;
      const baseCode = code;
      while (usedCodes.has(code) && counter < 100) {
        counter++;
        code = baseCode.substring(0, 6) + counter;
      }
      usedCodes.add(code);

      toInsert.push({
        code,
        name: a['NOME ASSOCIAZIONE'],
        city: a['PROVINCIA'],
        address: a['INDIRIZZO'],
        website: a['SITO WEB'] || null,
        lat: coords.lat,
        lng: coords.lng,
        country: 'Italy',
      });
      console.log(`✅ [${i+1}/${associations.length}] ${a['NOME ASSOCIAZIONE']} (${code})`);
    } else {
      console.log(`⚠️  [${i+1}/${associations.length}] ${a['NOME ASSOCIAZIONE']} - no coords`);
    }

    // Rate limit for Nominatim: 1 req/sec
    await new Promise(r => setTimeout(r, 1100));
  }

  if (toInsert.length > 0) {
    console.log(`\n💾 Inserting ${toInsert.length} associations...\n`);
    const { error } = await admin.from('associations').insert(toInsert);

    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log(`✅ DONE! ${toInsert.length} associations loaded to maps!\n🗺️  Refresh your browser to see the markers!`);
    }
  }
}

load().catch(console.error);
