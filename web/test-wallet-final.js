const jwt = require('jsonwebtoken');
const fs = require('fs');

const credentials = JSON.parse(fs.readFileSync('/opt/wasp/web/service-account-key.json', 'utf8'));
const ISSUER_ID = '3388000000023172631';

const passClaims = {
  iss: credentials.client_email,
  aud: 'google',
  origins: [],
  typ: 'savetowallet',
  payload: {
    genericClasses: [{
      id: `${ISSUER_ID}.wasp_card_class`,
      classTemplateInfo: {
        cardTemplateOverride: {
          fieldTemplateOverride: {
            textColor: '#FFFFFF',
            cardBackgroundColor: '#4CAF50'
          }
        }
      }
    }],
    genericObjects: [{
      id: `${ISSUER_ID}.wasp_user_001`,
      classId: `${ISSUER_ID}.wasp_card_class`,
      state: 'ACTIVE',
      cardTitle: { defaultValue: { language: 'en-US', value: 'WASP Card' } },
      header: { defaultValue: { language: 'en-US', value: 'Member Name' } }
    }]
  }
};

const token = jwt.sign(passClaims, credentials.private_key, { algorithm: 'RS256' });
console.log(`https://pay.google.com/gp/v/save/${token}`);
