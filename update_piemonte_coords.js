#!/usr/bin/env node

/**
 * MATCH AND UPDATE PIEMONTE COORDINATES
 * Match addresses from coordinates file to missing PIEMONTE records
 * Update database with matched LAT/LON
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Normalize address for matching
function normalizeAddress(addr) {
  return addr
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[,'"]/g, '');
}

async function matchAndUpdateCoords() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  MATCH & UPDATE PIEMONTE COORDINATES   ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Coordinates data provided by user
  const coordsData = [
    { address: "Regione Nosere - Via Polveriera, 28845 Domodossola", lat: 46.1118, lng: 8.3039 },
    { address: "Via Vivaro 17, Loc. Toppino, 12051 Alba", lat: 44.7042, lng: 8.0469 },
    { address: "Via Freinetto 8, 10050 Coazze (TO)", lat: 45.0531, lng: 7.3732 },
    { address: "Via Orfanotrofio 16, 13900 Biella (BI)", lat: 45.5625, lng: 8.0538 },
    { address: "Via Fonte Feja 86, 15060 Castelletto d'Orba (AL)", lat: 44.6851, lng: 8.6998 },
    { address: "Via Giovanni Amendola 48, 28010 Fontaneto d'Agogna (NO)", lat: 45.6425, lng: 8.4831 },
    { address: "Via Cascina San Giuseppe, 13040 Saluggia (VC)", lat: 45.2427, lng: 8.0163 },
    { address: "Via dei Partigiani 12, 10036 Settimo Torinese (TO)", lat: 45.1384, lng: 7.7661 },
    { address: "Strada per Pozzolo 111, 15067 Novi Ligure (AL)", lat: 44.7725, lng: 8.7964 },
    { address: "S.P. Pavia 22, 15122 Valmadonna (AL) (Rifugio Cascina Rosa)", lat: 44.9546, lng: 8.6258 },
    { address: "Via Ivrea 28, 13040 Borgo d'Ale (VC) (S.P. 80 n.71)", lat: 45.3512, lng: 8.0509 },
    { address: "Via Segletta 12, 12022 Busca (CN)", lat: 44.5178, lng: 7.4725 },
    { address: "Strada Vecchia per Tronzano, 13048 Santhià (VC)", lat: 45.3621, lng: 8.1648 },
    { address: "Via della Torre 1, 10015 Ivrea (TO)", lat: 45.4665, lng: 7.8762 },
    { address: "Via G.F. Bellezia 19, 10122 Torino (TO)", lat: 45.0744, lng: 7.6806 },
    { address: "Via Poligono, 15011 Acqui Terme (AL)", lat: 44.6732, lng: 8.4741 },
    { address: "Frazione Valdiberti 39, 12040 Santo Stefano Roero (CN)", lat: 44.7904, lng: 7.9402 },
    { address: "Via Magistrini 42, 28067 Comignago (NO)", lat: 45.6708, lng: 8.5631 },
    { address: "Via dei Rochi 78, 10064 Pinerolo (TO)", lat: 44.8974, lng: 7.3195 },
    { address: "Strada Comunale per Viguzzolo, 15050 Castellar Guidobono", lat: 44.9048, lng: 8.9213 },
    { address: "Frazione Bricco Rossi 12, 14018 Villafranca d'Asti (AT)", lat: 44.9126, lng: 8.0315 },
    { address: "Via Langhe 23, Zona Industriale Pollenzo, 12042 Bra (CN)", lat: 44.6865, lng: 7.8784 },
    { address: "Via Lepetit, 12075 Garessio (CN) (Casello Sant'Erasmo 134)", lat: 44.1953, lng: 8.0124 },
    { address: "Via Verona 1, 15121 Alessandria (AL)", lat: 44.9103, lng: 8.6181 },
    { address: "Località Valfenera, 14016 Valfenera (AT)", lat: 44.9015, lng: 7.9621 },
    { address: "Strada del Tario 6, 10023 Chieri (TO)", lat: 45.0189, lng: 7.8115 },
    { address: "Via Torino 78, Fraz. Madonna dell'Olmo, 12100 Cuneo", lat: 44.4087, lng: 7.5348 },
    { address: "Strada Poirino 101, Pinerolo", lat: 44.8812, lng: 7.3524 },
    { address: "Via Borgata Castelvecchio 85/A, Loreto, 12045 Fossano", lat: 44.5381, lng: 7.7029 },
    { address: "Via per Gozzano 68/A, 28021 Borgomanero (NO)", lat: 45.7112, lng: 8.4605 },
    { address: "Via del Ruata, 10067 Vigone (TO)", lat: 44.8436, lng: 7.4952 },
    { address: "Via Moncalieri 114/E, 10090 Gassino Torinese (TO)", lat: 45.1189, lng: 7.8184 },
    { address: "Cascina Fittavolini 8, Fraz. Levata, 15062 Bosco Marengo", lat: 44.8214, lng: 8.6531 },
    { address: "Strada Comunale della Berlia 106, 10095 Collegno (TO)", lat: 45.0864, lng: 7.5701 },
    { address: "Via Barbavara 25, Frazione Vignarello, 28070 Tornaco (NO)", lat: 45.3402, lng: 8.7084 },
    { address: "Corso Galileo Ferraris, Piazza d'Armi, 10134 Torino (TO)", lat: 45.0503, lng: 7.6612 },
    { address: "Via Ottavio Rivetti 25, 13030 Rovasenda (VC)", lat: 45.5412, lng: 8.3184 },
    { address: "Frazione Sottovalle 107, 15061 Arquata Scrivia (AL)", lat: 44.6465, lng: 8.8612 },
    { address: "Via San Luigi 103, 10043 Orbassano (TO) (Reg. Gonzole 10)", lat: 45.0114, lng: 7.5587 },
    { address: "Via Mulino Sette Salti 4/A, 12020 Tarantasca (CN)", lat: 44.4921, lng: 7.5415 },
    { address: "Via Gariboggio 12, 12080 Vicoforte (CN)", lat: 44.3642, lng: 7.8596 },
    { address: "Strada della Palazza, Frazione Boschetto, Chivasso", lat: 45.2031, lng: 7.9254 },
    { address: "Via Ghilini 73, Valmadonna, Alessandria", lat: 44.9512, lng: 8.6148 },
    { address: "Via Molinasso 2, 12035 Racconigi", lat: 44.7645, lng: 7.6741 },
    { address: "Via G. Marconi 16, 10010 Settimo Vittone", lat: 45.5489, lng: 7.8341 },
    { address: "Viale Bligny 22, Milano", lat: 45.4518, lng: 9.1932 },
    { address: "Via Germagnano 11, 10152 Torino", lat: 45.1091, lng: 7.6931 },
    { address: "Frazione San Marzanotto 74, Asti (AT)", lat: 44.8624, lng: 8.2145 },
    { address: "Via Maria Montessori 3, Casalborgone (TO)", lat: 45.1312, lng: 7.9405 },
    { address: "Via Bainsizza, Cascina San Bartolomeo, Vercelli (VC)", lat: 45.3204, lng: 8.4114 },
    { address: "Via Pacioni, Gerbido, Sommariva Perno (CN)", lat: 44.7431, lng: 7.8864 },
    { address: "Via d'Arezzo 2, Basiglio (MI)", lat: 45.3496, lng: 9.1624 },
    { address: "Via Solferino 12, Avigliana (TO)", lat: 45.0772, lng: 7.3981 },
    { address: "Via Monviso 16, 10095 Grugliasco (TO)", lat: 45.0648, lng: 7.5812 },
    { address: "Via Pola 1, Acqui Terme (AL)", lat: 44.6781, lng: 8.4645 },
    { address: "Via Frazione Variglie 98, Asti (AT)", lat: 44.8814, lng: 8.1602 },
    { address: "Strada Comunale per Castelnuovo, Tortona (AL)", lat: 44.9081, lng: 8.8514 },
    { address: "Regione Luja 2, Loazzolo (AT)", lat: 44.6704, lng: 8.2612 },
    { address: "Via Garibaldi 12, Pinerolo (TO)", lat: 44.8856, lng: 7.3304 },
    { address: "Frazione San Defendente 12, Tarantasca (CN)", lat: 44.4984, lng: 7.5512 },
    { address: "Via della Chiusa 4, Galliate (NO)", lat: 45.4741, lng: 8.6981 },
    { address: "Frazione San Marzanotto, Asti (AT)", lat: 44.8645, lng: 8.2104 },
    { address: "Via Longarone 12, Monza (MB)", lat: 45.5721, lng: 9.2536 },
    { address: "Frazione San Francesco Benne 32, Oglianico (TO)", lat: 45.3418, lng: 7.6951 },
    { address: "Via Enzo Geildi 1, Vercelli (VC)", lat: 45.3184, lng: 8.4042 },
    { address: "Centro Visite Oasi, Morozzo (CN)", lat: 44.4231, lng: 7.6914 },
    { address: "Frazione San Carlo, Tigliole d'Asti (AT)", lat: 44.8831, lng: 8.0814 },
    { address: "Via Bassa 14, Sala Biellese (BI)", lat: 45.5084, lng: 7.9521 },
    { address: "Località San Bernardo 67, Sommariva Perno (CN)", lat: 44.7501, lng: 7.8924 },
    { address: "Via Fornace Serralunga 1, Biella (BI)", lat: 45.5702, lng: 8.0415 },
    { address: "Strada d'Alba 18, Moncalieri (TO)", lat: 45.0021, lng: 7.6942 },
    { address: "Via San Rocco 12, Piasco (CN)", lat: 44.5645, lng: 7.4518 },
    { address: "Via Vignola 6, Pecetto Torinese (TO)", lat: 45.0164, lng: 7.7512 }
  ];

  console.log(`1. Loaded ${coordsData.length} coordinates from provided data\n`);

  // Fetch PIEMONTE records without coords
  console.log('2. Fetching PIEMONTE associations without coordinates...');
  const { data: piemonteRecords, error } = await supabase
    .from('associations')
    .select('id, code, name, address')
    .gte('code', 'ITA0956')
    .lte('code', 'ITA1248')
    .is('lat', null);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`   Found ${piemonteRecords?.length || 0} records without coordinates\n`);

  // Match addresses
  console.log('3. Matching addresses...');
  const matches = [];
  const normalized_coords = coordsData.map(c => ({
    ...c,
    normalized: normalizeAddress(c.address)
  }));

  piemonteRecords?.forEach(rec => {
    const normalized_rec = normalizeAddress(rec.address || '');

    // Try exact normalized match first
    const match = normalized_coords.find(c => c.normalized === normalized_rec);

    if (match) {
      matches.push({
        id: rec.id,
        code: rec.code,
        name: rec.name,
        address: rec.address,
        lat: match.lat,
        lng: match.lng
      });
    }
  });

  console.log(`   ✓ Found ${matches.length} matching coordinates\n`);

  if (matches.length === 0) {
    console.log('⚠️  No matches found. Check address format.\n');
    process.exit(0);
  }

  // Update database
  console.log('4. Updating database...');
  let updated = 0;

  for (const match of matches) {
    const { error: updateError } = await supabase
      .from('associations')
      .update({ lat: match.lat, lng: match.lng })
      .eq('id', match.id);

    if (!updateError) {
      updated++;
      process.stdout.write(`\r   Updated: ${updated}/${matches.length}`);
    }
  }

  console.log('\n\n╔════════════════════════════════════════╗');
  console.log('║         UPDATE COMPLETE!               ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✓ Matched and updated: ${updated}/${matches.length}`);
  console.log(`⚠️  Still missing coords: ${(piemonteRecords?.length || 0) - updated}\n`);

  // Show matched records
  console.log('📍 Updated records:');
  matches.forEach(m => {
    console.log(`   ${m.code} | ${m.name.substring(0, 40).padEnd(40)} | ${m.lat}, ${m.lng}`);
  });
  console.log();
}

matchAndUpdateCoords().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
