const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

(async () => {
  console.log('Fetching all associations with pagination...\n');

  let allRecords = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('associations')
      .select('country')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error:', error);
      break;
    }

    if (!data || data.length === 0) {
      break;
    }

    allRecords = allRecords.concat(data);
    console.log(`  Fetched page ${page + 1}: ${data.length} records (Total: ${allRecords.length})`);
    page++;
  }

  const countryMap = new Map();
  allRecords.forEach(row => {
    if (row.country) {
      countryMap.set(row.country, (countryMap.get(row.country) ?? 0) + 1);
    }
  });

  console.log('\nCountries in database:');
  Array.from(countryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, count]) => {
      console.log(`  ${country}: ${count}`);
    });

  const total = Array.from(countryMap.values()).reduce((a, b) => a + b, 0);
  console.log(`\nTotal: ${total}`);
})();
