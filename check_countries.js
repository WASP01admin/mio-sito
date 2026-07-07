const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

(async () => {
  const { data } = await supabase
    .from('associations')
    .select('country', { count: 'exact' });

  const countryMap = new Map();
  data?.forEach(row => {
    if (row.country) {
      countryMap.set(row.country, (countryMap.get(row.country) ?? 0) + 1);
    }
  });

  console.log('Countries in database:');
  Array.from(countryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, count]) => {
      console.log(`  ${country}: ${count}`);
    });
  console.log(`\nTotal: ${data?.length}`);
})();
