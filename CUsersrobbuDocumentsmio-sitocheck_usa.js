const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkUSA() {
  const { count: totalUSA } = await supabase
    .from('associations')
    .select('*', { count: 'exact', head: true })
    .eq('country', 'United States');

  const { count: onMapUSA } = await supabase
    .from('associations')
    .select('*', { count: 'exact', head: true })
    .eq('country', 'United States')
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  console.log(`USA Total: ${totalUSA}`);
  console.log(`USA On Map: ${onMapUSA}`);
  console.log(`USA Coverage: ${((onMapUSA/totalUSA)*100).toFixed(1)}%`);
}

checkUSA().catch(e => console.error(e.message));
