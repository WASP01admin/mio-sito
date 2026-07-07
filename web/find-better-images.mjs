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

// Try different image URLs - direct Wikipedia links
const imageUpdates = {
  'Giulia': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop',
  'Ricky': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop',
  'Sabrina': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop'
};

async function testAndUpdate() {
  console.log('Testing image URLs...\n');
  
  for (const [name, url] of Object.entries(imageUpdates)) {
    try {
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      console.log(`${name}: ${response.ok ? '✓ Working' : '✗ Status ' + response.status}`);
    } catch (e) {
      console.log(`${name}: ✗ Error - ${e.message}`);
    }
  }
  
  console.log('\nNote: Using placeholder images from Unsplash (free stock photos)');
  console.log('For real person photos, you would need:');
  console.log('1. Professional headshots you own/have rights to');
  console.log('2. Images from public sources (Wikipedia, etc) with proper attribution');
  console.log('3. Stock photo services with licenses');
}

testAndUpdate().catch(console.error);
