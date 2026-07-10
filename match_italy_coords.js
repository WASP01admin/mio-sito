#!/usr/bin/env node

/**
 * MATCH AND UPDATE ITALY COORDINATES
 * Match addresses from lookup to 314 Italian associations (excluding PIEMONTE)
 * Update database with matched LAT/LON
 */

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

async function matchAndUpdateItalyCoords() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  MATCH & UPDATE ITALY COORDINATES      ║');
  console.log('║  (Excluding PIEMONTE)                  ║');
  console.log('╚════════════════════════════════════════╝\n');

  // All coordinates provided by user - comprehensive list
  const coordsData = [
    // LOMBARDY
    { address: "Via II Giugno 5, 26010 Vaiano Cremasco", lat: 45.3725, lng: 9.5874 },
    { address: "Via Plava 13, 23900 Lecco", lat: 45.8459, lng: 9.3941 },
    { address: "Via Frate Galdino 22, 23900 Lecco", lat: 45.8441, lng: 9.4012 },
    { address: "Fraz. Ca' dell'Acqua 4, 26851 Borgo San Giovanni", lat: 45.2814, lng: 9.4312 },
    { address: "Via Defendente 70, 26900 Lodi", lat: 45.3112, lng: 9.5089 },
    { address: "Loc. Cascina Castagna 4, 26854 Pieve Fissiraga", lat: 45.2631, lng: 9.4874 },
    { address: "Via Lodi 1, Fraz. Villa Pompeiana, 26839 Zelo Buon Persico", lat: 45.3854, lng: 9.4412 },
    { address: "Strada Provinciale Est 154, 46019 Pergognaga", lat: 44.9921, lng: 10.9704 },
    { address: "Via San Damiano 21, 20900 Monza", lat: 45.5684, lng: 9.2902 },
    { address: "Via 8 Marzo 160, 20812 Limbiate", lat: 45.6031, lng: 9.1384 },
    // PAVIA
    { address: "Strada Per Mirabello 6, 27010 San Genesio ed Uniti", lat: 45.2281, lng: 9.1764 },
    { address: "Via Navazzone 1, 27020 Travacò Siccomario", lat: 45.1436, lng: 9.1581 },
    { address: "Via Valletta Fogliano 100, 27029 Vigevano", lat: 45.2974, lng: 8.8715 },
    { address: "Via Maestra, Frazione Medaglia, 27036 Mortara", lat: 45.2415, lng: 8.7112 },
    { address: "Via Ragazzi del 99, Loc. Castelletto, 27035 Mede", lat: 45.1018, lng: 8.7402 },
    { address: "Cascina Madonna snc, 27030 Zeme", lat: 45.1556, lng: 8.6631 },
    // SONDRIO
    { address: "Via Campello 1, loc. Busteggia, 23020 Montagna in Valtellina", lat: 46.1624, lng: 9.9142 },
    // LIGURIA
    { address: "Via Rollino 92, Loc. Monte Contessa, 16154 Genova", lat: 44.4361, lng: 8.8354 },
    { address: "Via Rollino 80, Loc. Monte Gazzo, 16154 Genova", lat: 44.4372, lng: 8.8398 },
    { address: "Via Tonnego, 16035 Rapallo", lat: 44.3645, lng: 9.2081 },
    { address: "P.le Francesco Crispi, Cancello, 16148 Genova", lat: 44.3912, lng: 8.9814 },
    { address: "Via Nazionale Piemonte 158, Cadibona", lat: 44.3364, lng: 8.4215 },
    { address: "Via Massa 11/R, Loc. Legino, 17100 Savona", lat: 44.2981, lng: 8.4521 },
    { address: "Via Valgelata 5, 17024 Finale Ligure", lat: 44.1812, lng: 8.3304 },
    { address: "Regione Enesi 5, 17031 Albenga", lat: 44.0621, lng: 8.1951 },
    { address: "Via B. Dagna 34, 17014 Cairo Montenotte", lat: 44.4025, lng: 8.2714 },
    { address: "Via Capé, 17046 Sassello", lat: 44.4812, lng: 8.4902 },
    { address: "Via Del Monte s.n.c., Loc. San Venerio, 19136 La Spezia", lat: 44.1284, lng: 9.8645 },
    { address: "Via Pezzino Alto 27, Fraz. Le Grazie, 19025 Portovenere", lat: 44.0721, lng: 9.8315 },
    { address: "Via Rubiano / Via Tavolara, 19038 Sarzana", lat: 44.1214, lng: 9.9701 },
    // TRENTINO-ALTO ADIGE
    { address: "Via delle Bettine 15, Loc. Centa, 38121 Trento", lat: 46.0845, lng: 11.1214 },
    { address: "Via Briga Acqui 34, 38100 Trento", lat: 46.0612, lng: 11.1342 },
    { address: "Viale dei Tigli 47/d, 38066 Riva del Garda", lat: 45.8856, lng: 10.8491 },
    { address: "Loc. Val dei Faori, 38050 Canal San Bovo", lat: 46.1554, lng: 11.7341 },
    { address: "Loc. Ischia, 38030 Ziano di Fiemme", lat: 46.2841, lng: 11.5612 },
    { address: "Via Castel Ried 12, Comune di Renon (BZ)", lat: 46.5184, lng: 11.3702 },
    { address: "Larcherberg 481, Santa Valburga, Val d'Ultimo", lat: 46.5491, lng: 11.0021 },
    { address: "Via dei Carrettai 5, 39030 Vandoies", lat: 46.8142, lng: 11.7214 },
    // VENETO
    { address: "Via E. Barsanti 19/b, Loc. Bassona, 37139 Verona", lat: 45.4614, lng: 10.9145 },
    { address: "Via F. Zamboni 1, 31015 Conegliano", lat: 45.8921, lng: 12.2891 },
    { address: "Via Maestri del Lavoro 101, Loc. Giare, Mira", lat: 45.4212, lng: 12.1402 },
    { address: "Via Carducci 9/A sc.A int.1, 30171 Mestre", lat: 45.4924, lng: 12.2391 },
    { address: "Strada Statale 309, km 80, 98/X, 30034 Sant'Anna di Chioggia", lat: 45.1481, lng: 12.2612 },
    { address: "Via Stazione 4, c/o Tenuta Civrana, Pegolotte di Cona", lat: 45.1845, lng: 12.0164 },
    { address: "Via Malipiera 23, Cona", lat: 45.1784, lng: 12.0315 },
    { address: "Via Mantovani 41, Loc. Gogna, 36100 Vicenza", lat: 45.5381, lng: 11.5302 },
    { address: "Via Cà Morolazzaro 2, 36020 Pove del Grappa", lat: 45.7942, lng: 11.7314 },
    { address: "Via Caduti 14.09.1944, 34/H, 32100 Belluno", lat: 46.1489, lng: 12.2104 },
    // FRIULI-VENEZIA GIULIA
    { address: "Via Orsera 8, 34145 Trieste", lat: 45.6184, lng: 13.8031 },
    { address: "Strada per Rupingrande 1098, 34151 Trieste (Opicina)", lat: 45.6921, lng: 13.7914 },
    { address: "Via degli Scogli 38, 34170 Gorizia", lat: 45.9542, lng: 13.6184 },
    { address: "Via San Francesco 2, Loc. Dobbia, Staranzano (GO)", lat: 45.8031, lng: 13.4912 },
    { address: "Via Camin, Fraz. Arcano Superiore, 33030 Rive d'Arcano", lat: 46.1345, lng: 13.0214 },
    { address: "Via Villutta 24, 33083 Chions", lat: 45.8612, lng: 12.8254 },
    { address: "Via Gonars 42, 33100 Udine", lat: 46.0465, lng: 13.2421 },
    // EMILIA-ROMAGNA
    { address: "Via dei Mulini 20/2 Loc. Scascoli, 40053 Loiano", lat: 44.3184, lng: 11.3645 },
    { address: "Via Rodiano 59, 40037 Sasso Marconi", lat: 44.3804, lng: 11.2312 },
    { address: "Viale Carlo Chiarioni 9, Loc. Pontelagoscuro, 44122 Ferrara", lat: 44.8715, lng: 11.6031 },
    { address: "Via Conchetta 58, Loc. Malborghetto di Boara, 44124 Ferrara", lat: 44.8602, lng: 11.6421 },
    { address: "Via Giulio Pastore 508, Loc. Torre del Moro, 47521 Cesena", lat: 44.1484, lng: 12.2164 },
    { address: "Via Bassetta 16, Loc. Villanova, 47122 Forlì", lat: 44.2541, lng: 12.0289 },
    { address: "Via Bassetta 16/D, Loc. Villanova, 47122 Forlì", lat: 44.2543, lng: 12.0292 },
    { address: "Via San Gemignano 26, 41122 Modena", lat: 44.6612, lng: 10.9431 },
    { address: "Via della Fonte 36, 41026 Pavullo nel Frignano", lat: 44.3314, lng: 10.8304 },
    { address: "Loc. Piani di Tiedole, 43043 Borgo Val di Taro", lat: 44.4684, lng: 9.9765 },
    { address: "Loc. Fornace Verani, 29014 Castell'Arquato", lat: 44.8612, lng: 9.8704 },
    { address: "Via delle Ghiane 186, 48015 Cervia", lat: 44.2641, lng: 12.3391 },
    { address: "Via Felesino 6, Villa Cella, 42124 Reggio Emilia", lat: 44.7189, lng: 10.5512 },
    { address: "Loc. Fagnano, 47867 Talamello", lat: 43.9015, lng: 12.3214 },
    // UMBRIA
    { address: "Via Colle 12, Bettona (PG)", lat: 43.0124, lng: 12.4831 },
    { address: "Loc. Mezzavia, fraz. Lerchi, 06012 Città di Castello", lat: 43.4412, lng: 12.1954 },
    { address: "Loc. Campoforte, Fraz. Schifanoia, 05035 Narni", lat: 42.5084, lng: 12.4412 },
    { address: "Via della Valtiera, Loc. Collestrada, 06135 Perugia", lat: 43.0915, lng: 12.4518 },
    { address: "Strada Ponte Pattoli - Monte Bello 2, 06134 Perugia", lat: 43.1864, lng: 12.4104 },
    { address: "Loc. Ferratelle, 06024 Gubbio", lat: 43.3245, lng: 12.5831 },
    { address: "Loc. Ponterosso, 06081 Assisi", lat: 43.0612, lng: 12.5981 },
    { address: "Loc. San Damiano 4, 06059 Todi", lat: 42.7724, lng: 12.4115 },
    { address: "Via Caracciolo, Loc. Corvia, 06034 Foligno", lat: 42.9641, lng: 12.7214 },
    { address: "Via 3 Ponti - Strada Vicinale Torrente Marroggia, 06042 Campello sul Clitunno", lat: 42.8231, lng: 12.7645 },
    { address: "Loc. Renari, 06031 Bevagna", lat: 42.9412, lng: 12.5902 },
    { address: "Via Firenze (ex aeroporto Eleuteri), 06061 Castiglione del Lago", lat: 43.1314, lng: 12.0512 },
    { address: "Voc. Sovano, Piediluco, 05100 Terni", lat: 42.6184, lng: 12.7531 },
    { address: "Strada di Monte Argento 40, 05100 Terni", lat: 42.5512, lng: 12.6714 },
    { address: "Strada di Lagarello, zona Colleluna, 05100 Terni", lat: 42.5784, lng: 12.6254 },
    { address: "Loc. Casa Rosati, 05021 Acquasparta", lat: 42.6912, lng: 12.5412 },
    { address: "Via dei Tessitori, 05018 Orvieto", lat: 42.6512, lng: 12.0431 },
    { address: "Km 6.4 della SR 317 Marscianese, Orvieto", lat: 42.7412, lng: 12.1645 },
    { address: "Loc. Sant'Antonio, 05010 San Venanzo", lat: 42.8104, lng: 12.2714 },
    // TUSCANY
    { address: "Via della Cernaia 54, 50129 Firenze", lat: 43.7841, lng: 11.2584 },
    { address: "Via S. Zanobi 82/r, 50129 Firenze", lat: 43.7791, lng: 11.2561 },
    { address: "Viale dei Mille 8, Campi Bisenzio", lat: 43.8214, lng: 11.1345 },
    { address: "Via da Bencistà a Gorioli, 50067 Bagno a Ripoli", lat: 43.7384, lng: 11.3195 },
    { address: "Via Majorana, Carraia, Empoli", lat: 43.7081, lng: 10.9612 },
    { address: "Via del Castelluccio dei Falaschi, 50053 Empoli", lat: 43.7112, lng: 10.9254 },
    { address: "Via Cà del Lanino 28, 52100 Arezzo", lat: 43.4841, lng: 11.8512 },
    { address: "Loc. Cicaleto, Sargiano, 52100 Arezzo", lat: 43.4414, lng: 11.8904 },
    { address: "Via Botriolo 39, 52028 Terranuova Bracciolini", lat: 43.5581, lng: 11.5312 },
    { address: "Loc. Ossaia, 52044 Cortona", lat: 43.2542, lng: 11.9764 },
    { address: "Via Esterna Fontebranda, 53100 Siena", lat: 43.3184, lng: 11.3245 },
    { address: "Loc. Gavignano Drove, 53036 Poggibonsi", lat: 43.4912, lng: 11.1384 },
    { address: "Loc. Torrita di Siena (SI)", lat: 43.1702, lng: 11.7514 },
    { address: "Via Santeschi, Loc. Pontetetto, 55100 Lucca", lat: 43.8214, lng: 10.4931 },
    { address: "Via della Chiusa, Arliano, 55100 Lucca", lat: 43.8391, lng: 10.4215 },
    { address: "Loc. Roncato, Diecimo, 55023 Borgo a Mozzano", lat: 43.9542, lng: 10.5184 },
    { address: "Via L. Salvatori 1, 55049 Viareggio", lat: 43.8761, lng: 10.2541 },
    { address: "Loc. Nugola, Collesalvetti", lat: 43.5904, lng: 10.4436 },
    { address: "Via della Cooperazione, Livorno", lat: 43.5612, lng: 10.3391 },
    { address: "Loc. Il Corbolone, Livorno", lat: 43.5315, lng: 10.4042 },
    { address: "Loc. Macelli, 57025 Piombino", lat: 42.9414, lng: 10.5189 },
    { address: "Via del Paduletto snc, 57023 Cecina", lat: 43.3112, lng: 10.5084 },
    { address: "Zona Campo di Marte, Livorno", lat: 43.5412, lng: 10.3214 },
    // MARCHE
    { address: "Loc. Bolignano, Fraz. Candia, 60100 Ancona", lat: 43.5584, lng: 13.4912 },
    { address: "Via Chiaravallese 135, San Paterniano, 60027 Osimo", lat: 43.5081, lng: 13.4315 },
    { address: "Loc. Piagge d'Olmo, 60044 Fabriano", lat: 43.3421, lng: 12.8951 },
    { address: "Via San Michele, 60040 Cerreto d'Esi", lat: 43.3184, lng: 12.9814 },
    { address: "Strada Madonna del Monte, Loc. Santa Veneranda, 61121 Pesaro", lat: 43.8912, lng: 12.8902 },
    { address: "Loc. Cardeto snc, 61023 Macerata Feltria", lat: 43.8114, lng: 12.4431 },
    { address: "Via San Biagio snc, ex Mattatoio Foro Boario, 61045 Pergola", lat: 43.5645, lng: 12.8315 },
    { address: "Loc. Muraglione 1, 61013 Sassofeltrio", lat: 43.8915, lng: 12.5084 },
    { address: "Via Ca' Gasperino 11, Loc. Ca' Lucio, 61029 Urbino", lat: 43.7431, lng: 12.6124 },
    { address: "Via Vanni 8/10, 62014 Petriolo", lat: 43.2184, lng: 13.4715 },
    { address: "Via S. Grisei 19, 62010 Morrovalle", lat: 43.3142, lng: 13.6031 },
    { address: "Loc. Alvata, 62018 Potenza Picena", lat: 43.3814, lng: 13.6912 },
    { address: "Loc. Montefiore, 62019 Recanati", lat: 43.4042, lng: 13.4914 },
    { address: "Contrada Colleluce 37, 62027 San Severino Marche", lat: 43.2189, lng: 13.2312 },
    { address: "Via Acquevive 14, 62100 Macerata", lat: 43.3084, lng: 13.4415 },
    { address: "Contrada Campo di Bove, 62010 Appignano", lat: 43.3612, lng: 13.3518 },
    { address: "Villa Luciani, Via Alpi 300, 63812 Montegranaro", lat: 43.2427, lng: 13.6184 },
    { address: "Contrada S. Martino 2/A, Ete Caldarette, 63900 Fermo", lat: 43.1512, lng: 13.7214 },
    { address: "C.da Monti di Monterubbiano 6A, 63823 Lapedona", lat: 43.1114, lng: 13.7431 },
    { address: "Via Cretarola 1165, 63811 Sant'Elpidio a Mare", lat: 43.2645, lng: 13.6912 },
    { address: "Via Graziani 71, 63023 Fermo", lat: 43.1604, lng: 13.7145 },
    // LAZIO
    { address: "Via della Magliana 856, 00148 Roma", lat: 41.8214, lng: 12.4031 },
    { address: "Via Commenda di Malta 4, 00178 Roma", lat: 41.8391, lng: 12.5584 },
    { address: "Via Scifelle 1 / Via Ostiense, 00100 Roma", lat: 41.7645, lng: 12.3512 },
    { address: "Strada di Montelupoli 45, Campagnano di Roma", lat: 42.1384, lng: 12.3814 },
    { address: "Via della Libertà 145, 00024 Castel Madama", lat: 41.9741, lng: 12.8951 },
    { address: "Via Braccianese Claudia km. 26,050, 00062 Bracciano", lat: 42.0845, lng: 12.1704 },
    { address: "Via Braccianense Km 17, 00062 Bracciano", lat: 42.0312, lng: 12.2514 },
    { address: "Via Monachelle Vecchia 47, 00071 Pomezia", lat: 41.6915, lng: 12.5112 },
    { address: "Via dei Corsi, 00040 Rocca di Papa", lat: 41.7584, lng: 12.7104 },
    { address: "Via Aurelia km. 48,900 Loc. Furbara, 00058 Santa Marinella", lat: 42.0124, lng: 12.0315 },
    { address: "Via delle Pesche 9, Scorano Capena (RM)", lat: 42.1512, lng: 12.5942 },
    { address: "Via Trevisani 35, Roma", lat: 41.9142, lng: 12.4312 },
    { address: "Via Congiunte dx, 04100 Latina", lat: 41.4814, lng: 12.8762 },
    { address: "Via Vagni 43, 03033 Arpino", lat: 41.6456, lng: 13.6124 },
    { address: "Via Pallisco 6, 03033 Arpino", lat: 41.6512, lng: 13.6204 },
    { address: "P.za del Mercato c/o ex Mattatoio Foro Boario, 02100 Rieti", lat: 42.4042, lng: 12.8596 },
    { address: "Strada Novepani, Bagnaia, 01100 Viterbo", lat: 42.4215, lng: 12.1484 },
    { address: "Strada Grottana Km 2,400, Loc. S. Maria, Viterbo", lat: 42.4512, lng: 12.0914 },
    { address: "Via San Quirico, Viterbo", lat: 42.4164, lng: 12.1124 },
    // CAMPANIA
    { address: "Via Pianodardine, Contrada Valleverde, 83042 Atripalda", lat: 40.9254, lng: 14.8312 },
    { address: "Contrada Toppagallo, 83044 Bisaccia", lat: 41.0114, lng: 15.3645 },
    { address: "Via Spalandrone snc, Contrada Toppole, 83040 Luogosano", lat: 40.9891, lng: 14.9921 },
    { address: "Contrada Sant'Anna 20, 83013 Mercogliano", lat: 40.9184, lng: 14.7431 },
    { address: "Contrada Strascizzo di San Vito, 83048 Montella", lat: 40.8364, lng: 15.0612 },
    { address: "Contrada Pescara, 83030 Savignano Irpino", lat: 41.1341, lng: 15.1845 },
    { address: "Via Parco San Giovanni 4B, 84080 Pellezzano (SA)", lat: 40.7189, lng: 14.7645 },
    { address: "Contrada Rotola, 82010 Ceppaloni", lat: 41.0612, lng: 14.7584 },
    { address: "Via Gianguarriello, 82018 San Giorgio del Sannio", lat: 41.0645, lng: 14.8512 },
    { address: "Palazzo del Volontariato, Viale Mellusi 68, 82100 Benevento", lat: 41.1314, lng: 14.7891 },
    { address: "Via Janfolla, Loc. Miano, 80145 Napoli", lat: 40.8912, lng: 14.2431 },
    { address: "Via Virginia Woolf, Ponticelli, 80146 Napoli", lat: 40.8541, lng: 14.3314 },
    { address: "Via Marigliano Cancello 1, Contrada Sannereto snc, 80011 Acerra", lat: 40.9612, lng: 14.4104 },
    { address: "Via D. Padula 117, 80100 Napoli", lat: 40.8364, lng: 14.1891 },
    { address: "Via Licola Mare, traversa Primavera, Licola, 80078 Pozzuoli", lat: 40.8612, lng: 14.0512 },
    { address: "Via vicinale Capua per Polvica, loc. Cianculli snc, 80035 Nola", lat: 40.9414, lng: 14.5084 },
    { address: "Via A. Da Salerno 13, 80128 Napoli", lat: 40.8441, lng: 14.2254 },
    { address: "Via Ostaglio, Altimari, 84100 Salerno", lat: 40.6814, lng: 14.8214 },
    { address: "Via Carrara D'Amora, Loc. Fiano, 84014 Nocera Inferiore", lat: 40.7512, lng: 14.6184 },
    { address: "Via G.B. Casciello snc, 84018 Scafati", lat: 40.7645, lng: 14.5312 },
    { address: "Loc. Sudame, Torre Orsaia", lat: 40.1345, lng: 15.4714 },
    { address: "Via L.mare Colombo 83, 84100 Salerno", lat: 40.6684, lng: 14.7915 },
    { address: "Via S. Antonio, Loc. Ercole, 81100 Caserta", lat: 41.0841, lng: 14.3214 },
    { address: "Via Gentile 8, 81031 Aversa", lat: 40.9765, lng: 14.2104 },
    { address: "Via Casilina km 188+500, 81052 Pignataro Maggiore", lat: 41.1912, lng: 14.1764 },
    { address: "Via Fonticelme, 81014 Capriati al Volturno", lat: 41.4645, lng: 14.1484 },
    { address: "c/o Vle A. Lincoln 239, 81100 Caserta", lat: 41.0691, lng: 14.3421 },
    // MOLISE
    { address: "Via A. De Pretis 10, 86100 Campobasso", lat: 41.5584, lng: 14.6531 },
    { address: "Contrada Valli Nuove snc, 86100 Campobasso", lat: 41.5721, lng: 14.6312 },
    { address: "Via Garibaldi, Loc. Mirabello, 86100 Campobasso", lat: 41.5114, lng: 14.6741 },
    { address: "Contrada Rotola, Campobasso (CB)", lat: 41.5436, lng: 14.6912 },
    // BASILICATA
    { address: "Contrada Le Matinelle, Borgo Picciano, 75100 Matera", lat: 40.6981, lng: 16.5584 },
    { address: "Via Tagliamento snc, 75025 Policoro", lat: 40.2104, lng: 16.6645 },
    { address: "Contrada Le Piane, Ferrandina / Bernalda area", lat: 40.4542, lng: 16.5081 },
    { address: "Contrada Pantano / Marconia, 75015 Pisticci", lat: 40.2814, lng: 16.6124 },
    // APULIA
    { address: "Strada Comunale Caldarola 125, 70124 Bari", lat: 41.1091, lng: 16.8904 },
    { address: "Viale dei Fiordalisi, 70124 Bari", lat: 41.0841, lng: 16.8354 },
    { address: "Strada Provinciale Gioia del Colle Km 0,600, 70023 Gioia del Colle", lat: 40.8031, lng: 16.9214 },
    { address: "Contrada Auricarro c/o Residence Le Palme, 70027 Palo del Colle", lat: 41.0415, lng: 16.6981 },
    { address: "Contrada Brenca, 70042 Mola di Bari", lat: 41.0364, lng: 17.0612 },
    { address: "Zona Boaria, 70056 Molfetta", lat: 41.1912, lng: 16.5831 },
    { address: "Contrada Torre d'Orta, 70043 Monopoli", lat: 40.9241, lng: 17.2714 },
    { address: "Via Gioia del Colle, zona industriale, 70017 Putignano", lat: 40.8391, lng: 17.1114 },
    { address: "Contrada Fichicelle, San Rocco, 70010 Valenzano", lat: 41.0289, lng: 16.8762 },
    { address: "Via G. Parini 43, 70033 Corato", lat: 41.1484, lng: 16.4215 },
    { address: "Contrada I Maggio, 73019 Trepuzzi", lat: 40.4212, lng: 18.0645 },
    { address: "Agro di Parabita, 73046 Matino", lat: 40.0465, lng: 18.1189 },
    { address: "Via Mungetti, 73044 Galatone", lat: 40.1436, lng: 18.0512 },
    { address: "Via Trieste 131, 73047 Monteroni di Lecce", lat: 40.3245, lng: 18.0904 },
    { address: "Via per Grottaglie 33, 74027 San Giorgio Jonico", lat: 40.4614, lng: 17.3814 },
    { address: "Via Manfredonia Km 2,1 - 71100 Foggia", lat: 41.4841, lng: 15.5702 },
    { address: "Contrada Santa Lucia, Litoranea per Cerano, 72100 Brindisi", lat: 40.5645, lng: 17.9814 },
    { address: "Contrada Aspri 40, Loc. Terranova, 72012 Carovigno", lat: 40.6912, lng: 17.6531 },
    { address: "Contrada Abaterisi, 72015 Fasano", lat: 40.8512, lng: 17.3942 },
    { address: "Contrada Barbagianni, 72017 Ostuni", lat: 40.7189, lng: 17.5412 },
    // CALABRIA
    { address: "Contrada Malucano, 88050 Caraffa di Catanzaro", lat: 38.8831, lng: 16.4912 },
    { address: "Via A. Ricucci, 87020 Cetraro", lat: 39.5114, lng: 15.9405 },
    { address: "Piazza dei Briganti, 87052 Croce di Magara", lat: 39.3245, lng: 16.4412 },
    { address: "Via San Marco 3/A, 87058 Spezzano della Sila", lat: 39.3015, lng: 16.3481 },
    { address: "Via Spalato 49, 89048 Siderno Marina", lat: 38.2714, lng: 16.3042 },
    { address: "Viale Affaccio 3° traversa 32, 89900 Vibo Valentia", lat: 38.6741, lng: 16.1114 },
    // ABRUZZO
    { address: "S.S. 17 bis n°49, Fraz. Paganica, 67100 L'Aquila", lat: 42.3614, lng: 13.4715 },
    { address: "Via del Pretaro snc, 67050 Lecce nei Marsi", lat: 41.9312, lng: 13.5391 },
    { address: "Via dei Mirtilli 5, 67068 Scurcola Marsicana", lat: 42.0645, lng: 13.3391 },
    { address: "Via Generale Carlo Spatocco 139, 64100 Teramo", lat: 42.6612, lng: 13.6914 },
    { address: "Via Ascolana 53, c/o Rifugio Canalba, 64011 Alba Adriatica", lat: 42.8314, lng: 13.9142 },
    { address: "Contrada Carapollo, 64100 Teramo", lat: 42.6481, lng: 13.7215 },
    { address: "Via Colle di Giorgio 25, 64020 Castellalto", lat: 42.6804, lng: 13.8114 },
    { address: "Via Milli snc, 64026 Roseto degli Abruzzi", lat: 42.6741, lng: 14.0124 },
    { address: "Via Raiale snc, 65128 Pescara", lat: 42.4584, lng: 14.1845 },
    { address: "Via Aldo Moro snc, 65026 Popoli", lat: 42.1741, lng: 13.8312 },
    { address: "Via Mercatello 4, 66100 Chieti", lat: 42.3481, lng: 14.1645 },
    { address: "Contrada Valle Merlo snc, 66023 Francavilla al Mare", lat: 42.4114, lng: 14.2814 },
    { address: "Sede Legale: Via Perez 4, Ortona", lat: 42.3512, lng: 14.4042 },
    { address: "Contrada Colle Torino, 66011 Bucchianico", lat: 42.3084, lng: 14.1814 },
    { address: "Via Orientale, Contrada Vicenne, 66040 Fallo", lat: 41.9365, lng: 14.3214 },
    { address: "Località San Leonardo, 66016 Guardiagrele", lat: 42.2031, lng: 14.2184 },
    { address: "Loc. Villa Martelli, 66034 Lanciano", lat: 42.2184, lng: 14.4912 },
    { address: "Viale dei Pini, Contrada Villanesi, 66023 Francavilla al Mare", lat: 42.4195, lng: 14.2701 },
    { address: "Contrada Alboreto snc, 66026 Ortona", lat: 42.3391, lng: 14.3814 },
    // SICILY
    { address: "Via Ponte Corleone Talentino 1/2, 90100 Palermo", lat: 38.0845, lng: 13.3512 },
    { address: "Piazza Tiro a Segno 5, 90100 Palermo", lat: 38.1114, lng: 13.3814 },
    { address: "Via Fondo Ciaculli 1328, 90124 Palermo", lat: 38.0772, lng: 13.4115 },
    { address: "Contr. Baronessa S. Marco, Catania (CT)", lat: 37.4584, lng: 15.0315 },
    { address: "Strada Provinciale 50, Portella Castanea, Messina", lat: 38.2542, lng: 15.5302 },
    { address: "Contrada Marchesana, 98050 Terme Vigliatore", lat: 38.1436, lng: 15.1645 },
    { address: "Contrada Dammusi, 96100 Siracusa", lat: 37.0841, lng: 15.2254 },
    { address: "Contrada Carancino 31, 96100 Siracusa", lat: 37.1114, lng: 15.1951 },
    { address: "Viale Angeli S. Giuliano 4, 97100 Ragusa", lat: 36.9254, lng: 14.7314 },
    { address: "Via 28, n.19, Fraz. Triscina di Selinunte, 91022 Castelvetrano", lat: 37.5812, lng: 12.8391 },
    { address: "Via E. Ghezzi 129, 92100 Agrigento", lat: 37.3204, lng: 13.5902 },
    { address: "Via Pausania snc, San Leone, 92100 Agrigento", lat: 37.2645, lng: 13.5831 },
    { address: "Contrada Maddalusa, 92100 Agrigento", lat: 37.2741, lng: 13.5512 },
    { address: "Contrada Calandra, 92024 Canicattì", lat: 37.3512, lng: 13.8412 },
    { address: "Contrada Galia, 92017 Sambuca di Sicilia", lat: 37.6414, lng: 13.0431 },
    { address: "Via F. Crispi 34, 93100 Caltanissetta", lat: 37.4912, lng: 14.0612 },
    { address: "Contrada Valle dei Ladroni snc, 94013 Leonforte", lat: 37.6481, lng: 14.4215 },
    { address: "Contrada Fontanazze SS.121, 94017 Regalbuto", lat: 37.6465, lng: 14.6312 },
    // SARDINIA
    { address: "Via Brenta, ex mattatoio, 09100 Cagliari", lat: 39.2312, lng: 9.1114 },
    { address: "Via E. Fermi 12, 09041 Dolianova", lat: 39.3814, lng: 9.1814 },
    { address: "Loc. Truncu is Follas snc, 09032 Assemini", lat: 39.2645, lng: 9.0124 },
    { address: "Via G. Di Vittorio, 09047 Selargius", lat: 39.2541, lng: 9.1645 },
    { address: "Zona San Michele / Is Mirrionis, 09121 Cagliari", lat: 39.2391, lng: 9.1084 },
    { address: "Campagne di Villacidro, 09039 Villacidro", lat: 39.4614, lng: 8.9142 },
    { address: "Via Monti di Jesgia 71, 07100 Sassari", lat: 40.7189, lng: 8.5831 },
    { address: "Loc. Funtana sa Figu, lungo strada per Osilo, Sassari", lat: 40.7384, lng: 8.6421 },
    { address: "Loc. Pala Pirastru, Santa Maria La Palma, 07041 Alghero", lat: 40.6412, lng: 8.2714 },
    { address: "Loc. Corte-Testimonzos, 08100 Nuoro", lat: 40.3391, lng: 9.3512 },
    { address: "Loc. Prato Sardo, 08100 Nuoro", lat: 40.3481, lng: 9.3114 },
    { address: "Loc. Monte Muradu, 08015 Macomer", lat: 40.2814, lng: 8.7915 },
    { address: "SP 52, Loc. Is Prunisceddas, 09092 Arborea", lat: 39.7645, lng: 8.5584 },
    { address: "Loc. Malosa, 09074 Ghilarza", lat: 40.1189, lng: 8.8354 },
    { address: "Loc. Oliveto Busachi, 09170 Oristano", lat: 39.9048, lng: 8.6114 },
    { address: "Via Messico 59, Loc. Colcò, 07026 Olbia", lat: 40.9114, lng: 9.5184 },
    { address: "Loc. Monti Aguisi, 07021 Arzachena", lat: 41.0772, lng: 9.3814 },
    { address: "Via Nazionale, Loc. Sa Terredda, 09013 Carbonia", lat: 39.1864, lng: 8.5312 },
    { address: "Loc. Salaponi, 09035 Gonnosfanadiga", lat: 39.3912, lng: 8.6204 },
    // VARESE
    { address: "Via Friuli 12, Loc. Pravaccio, 21100 Varese", lat: 45.8314, lng: 8.8412 },
    { address: "Clivio (VA), zona confine svizzero", lat: 45.8645, lng: 8.9314 },
    { address: "Via Giusti 80 (SS 336), 21019 Somma Lombardo", lat: 45.6684, lng: 8.7112 },
    { address: "Via Madonnetta 68, 22070 Locate Varesino", lat: 45.6912, lng: 8.9254 },
    { address: "Viale Vittorio Veneto 65, 21015 Lonate Pozzolo", lat: 45.6031, lng: 8.7514 },
    { address: "Via G. Gasparoli 174, 21012 Cassano Magnago", lat: 45.6814, lng: 8.8315 },
    { address: "Via Allende snc, 21013 Gallarate", lat: 45.6542, lng: 8.8104 },
  ];

  console.log(`1. Loaded ${coordsData.length} coordinates from your data\n`);

  // Fetch Italian records without coords (excluding PIEMONTE)
  console.log('2. Fetching Italian associations with addresses (excluding PIEMONTE)...');
  const { data: italyRecords, error } = await supabase
    .from('associations')
    .select('id, code, name, address')
    .eq('country', 'Italy')
    .lt('code', 'ITA0956')
    .not('address', 'is', null)
    .is('lat', null);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`   ✓ Found ${italyRecords?.length || 0} records without coordinates\n`);

  // Match addresses
  console.log('3. Matching addresses...');
  const matches = [];
  const normalized_coords = coordsData.map(c => ({
    ...c,
    normalized: normalizeAddress(c.address)
  }));

  let checked = 0;
  italyRecords?.forEach(rec => {
    const normalized_rec = normalizeAddress(rec.address || '');
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
    checked++;
  });

  console.log(`   ✓ Checked ${checked} records | Found ${matches.length} matching coordinates\n`);

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
  console.log(`⚠️  Still missing coords: ${(italyRecords?.length || 0) - updated}\n`);

  // Show sample
  console.log('📍 Sample of updated records:');
  matches.slice(0, 15).forEach(m => {
    console.log(`   ${m.code} | ${m.name.substring(0, 40).padEnd(40)} | ${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}`);
  });
  if (matches.length > 15) {
    console.log(`   ... and ${matches.length - 15} more\n`);
  } else {
    console.log();
  }
}

matchAndUpdateItalyCoords().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
