import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

function formatPrivateKey(keyStr) {
  const lines = keyStr.split('\n');
  const beginLine = lines[0];
  const endLine = lines[lines.length - 1];
  
  const keyData = lines.slice(1, -1).join('').replace(/\s/g, '');
  
  const formatted = [beginLine];
  for (let i = 0; i < keyData.length; i += 64) {
    formatted.push(keyData.substring(i, i + 64));
  }
  formatted.push(endLine);
  
  return formatted.join('\n');
}

// Read .env.local
import fs from 'fs';
const envContent = fs.readFileSync('.env.local', 'utf-8');
const credMatch = envContent.match(/GOOGLE_WALLET_CREDENTIALS_B64=(.+)/);
const credentialsB64 = credMatch[1];
const issuerId = envContent.match(/GOOGLE_WALLET_ISSUER_ID=(.+)/)[1];

const credentialsJson = Buffer.from(credentialsB64, 'base64').toString('utf-8');
const credentials = JSON.parse(credentialsJson);
let privateKey = credentials.private_key.replace(/\\n/g, '\n');
privateKey = formatPrivateKey(privateKey);

console.log('✓ Credentials loaded');
console.log('  Key length:', privateKey.length);
console.log('  Lines:', privateKey.split('\n').length);

const payload = {
  iss: issuerId,
  aud: 'google',
  origins: ['https://waspnest.org'],
  typ: 'savetowallet',
  payload: {
    genericObjects: [
      {
        id: `${issuerId}.test_001`,
        classId: `${issuerId}.generic_class`,
        textModulesData: [{ id: 'name', body: 'Test Name' }],
      },
    ],
  },
};

try {
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: '3600s',
  });
  console.log('✓ JWT signed successfully!');
  console.log('\n✓ Google Wallet link:');
  console.log(`https://pay.google.com/gp/v/save/${token}`);
} catch (error) {
  console.error('✗ Error:', error.message);
}
