const jwt = require('jsonwebtoken');
const fs = require('fs');

// Load credentials file directly (Google's way)
const credentials = JSON.parse(fs.readFileSync('/opt/wasp/web/service-account-key.json', 'utf8'));

const issuerId = '3388000000022996531'; // Replace with your issuer ID
const classId = `${issuerId}.testclass`;
const objectId = `${issuerId}.testobject123`;

// Create JWT payload (minimal, just a name)
const payload = {
  iss: credentials.client_email,
  aud: 'google',
  typ: 'savetowallet',
  payload: {
    genericObjects: [
      {
        id: objectId,
        classId: classId,
        genericType: 'GENERIC_TYPE_UNSPECIFIED',
        hexBackgroundColor: '#4CAF50',
        cardTitle: {
          defaultValue: {
            language: 'en-US',
            value: 'Test Card'
          }
        },
        subheader: {
          defaultValue: {
            language: 'en-US',
            value: 'Just A Name'
          }
        }
      }
    ]
  }
};

// Sign JWT with RS256
const token = jwt.sign(payload, credentials.private_key, { algorithm: 'RS256' });

console.log('JWT generated successfully');
console.log('JWT length:', token.length);
console.log('First 100 chars:', token.substring(0, 100));
console.log('\n=== SAVE URL ===');
console.log(`https://pay.google.com/gp/v/save/${token}`);
