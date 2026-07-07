import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};

envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: vips } = await supabase.from('vips').select('*').order('first_name');

console.log('Current VIP URLs in database:\n');
vips.forEach(v => {
  console.log(`${v.first_name} ${v.surname_initial}:`);
  console.log(`  ${v.image_url}\n`);
});

// Test if URLs are accessible
console.log('Testing URL accessibility...\n');
for (const vip of vips) {
  try {
    const response = await fetch(vip.image_url, { method: 'HEAD' });
    console.log(`${vip.first_name}: ${response.ok ? '✓ Accessible' : '✗ Error ' + response.status}`);
  } catch (e) {
    console.log(`${vip.first_name}: ✗ Error - ${e.message}`);
  }
}
