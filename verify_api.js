const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testPagination() {
  console.log('Testing API pagination simulation...\n');

  let allMarkers = [];
  let offset = 0;
  const pageSize = 1000;
  let iterations = 0;

  while (true) {
    iterations++;
    const { data: markers, error } = await supabaseAdmin
      .from('associations')
      .select('code, name, lat, lng')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error:', error);
      break;
    }

    if (!markers || markers.length === 0) break;

    console.log(`Iteration ${iterations}: Fetched ${markers.length} records (offset ${offset})`);
    allMarkers = allMarkers.concat(markers);

    if (markers.length < pageSize) break;
    offset += pageSize;
  }

  console.log(`\nTotal markers fetched: ${allMarkers.length}`);
}

testPagination().catch(e => console.error(e.message));
