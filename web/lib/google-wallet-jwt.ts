import jwt from "jsonwebtoken";
import QRCode from "qrcode";

interface GoogleWalletPassData {
  cardNumber: string;
  userName: string;
  issuedAt: Date;
  expiresAt: Date;
  associationName: string;
  associationCity: string;
  userEmail: string;
  photoUrl?: string;
}

// Class definition (template) - Google Wallet standard structure
function createGenericCardClass(issuerId: string) {
  return {
    id: `${issuerId}.generic_class`,
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['cardNumber']" }],
                },
              },
              endItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['expiry']" }],
                },
              },
            },
          },
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['association']" }],
                },
              },
              endItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['city']" }],
                },
              },
            },
          },
        ],
      },
    },
  };
}

// Generate QR code as data URI (base64)
async function generateQRCode(value: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(value, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
    });
    return qrDataUrl;
  } catch (error) {
    console.error("QR Code generation error:", error);
    throw new Error("Failed to generate QR code");
  }
}

// Object definition (individual pass instance) - Google Wallet standard structure
async function createGenericCardObject(
  passData: GoogleWalletPassData,
  issuerId: string,
  qrCodeDataUrl: string
) {
  const expiryDate = new Date(passData.expiresAt);
  const expiryFormatted = expiryDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return {
    id: `${issuerId}.${passData.cardNumber}`,
    classId: `${issuerId}.generic_class`,
    logo: {
      sourceUri: {
        uri: "https://waspnest.org/wasp-logo.png",
      },
      contentDescription: {
        defaultValue: {
          language: "en-US",
          value: "WASP Logo",
        },
      },
    },
    cardTitle: {
      defaultValue: {
        language: "en-US",
        value: "WASP Member Card",
      },
    },
    header: {
      defaultValue: {
        language: "en-US",
        value: passData.userName,
      },
    },
    subheader: {
      defaultValue: {
        language: "en-US",
        value: passData.associationName,
      },
    },
    textModulesData: [
      {
        id: "cardNumber",
        header: "CARD NUMBER",
        body: passData.cardNumber,
      },
      {
        id: "expiry",
        header: "EXPIRES",
        body: expiryFormatted,
      },
      {
        id: "association",
        header: "ASSOCIATION",
        body: passData.associationName,
      },
      {
        id: "city",
        header: "CITY",
        body: passData.associationCity,
      },
    ],
    barcode: {
      type: "QR_CODE",
      value: passData.cardNumber,
      alternateText: passData.cardNumber,
    },
    hexBackgroundColor: "#FFD400",
    ...(qrCodeDataUrl || passData.photoUrl ? {
      heroImage: {
        sourceUri: {
          uri: passData.photoUrl || "https://waspnest.org/wasp-logo.png",
        },
        contentDescription: {
          defaultValue: {
            language: "en-US",
            value: passData.photoUrl ? "Member Photo" : "WASP Logo",
          },
        },
      },
    } : {}),
  };
}

export async function generateGoogleWalletJwt(
  passData: GoogleWalletPassData,
  siteUrl?: string
): Promise<string> {
  const credentialsB64 = process.env.GOOGLE_WALLET_CREDENTIALS_B64;
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const baseUrl = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://waspnest.org";

  if (!credentialsB64) {
    throw new Error("Google Wallet credentials not configured");
  }

  if (!issuerId) {
    throw new Error("Google Wallet issuer ID not configured");
  }

  // Decode base64 credentials and parse JSON
  const credentialsJson = Buffer.from(credentialsB64, "base64").toString("utf-8");
  const credentials = JSON.parse(credentialsJson);

  const privateKey = credentials.private_key;

  if (!privateKey) {
    throw new Error("Invalid Google Wallet credentials: missing private key");
  }

  // Generate QR code
  const qrCodeDataUrl = await generateQRCode(passData.cardNumber);

  // Create card object with all required fields
  const cardObject = await createGenericCardObject(passData, issuerId, qrCodeDataUrl);

  // Extract origin from base URL (remove path if any)
  const originUrl = new URL(baseUrl);
  const origin = originUrl.origin;

  const payload = {
    iss: issuerId,
    aud: "google",
    origins: [origin],
    typ: "savetowallet",
    payload: {
      genericObjects: [cardObject],
    },
  };

  const token = jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "3600s",
  });

  return token;
}

export function getGoogleWalletSaveUrl(jwt: string): string {
  return `https://pay.google.com/gp/v/save/${jwt}`;
}

// Get OAuth2 token for Google Wallet API
async function getGoogleWalletOAuthToken(): Promise<string> {
  const credentialsB64 = process.env.GOOGLE_WALLET_CREDENTIALS_B64;

  if (!credentialsB64) {
    throw new Error("Google Wallet credentials not configured");
  }

  const credentialsJson = Buffer.from(credentialsB64, "base64").toString("utf-8");
  const credentials = JSON.parse(credentialsJson);

  const privateKey = credentials.private_key;
  if (!privateKey) {
    throw new Error("Invalid Google Wallet credentials: missing private key");
  }

  // Create JWT for OAuth2 token request
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const token = jwt.sign(jwtPayload, privateKey, {
    algorithm: "RS256",
  });

  // Exchange JWT for OAuth2 token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OAuth2 token request failed: ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

// Create Pass Object on Google Wallet API
export async function createGoogleWalletObjectOnApi(
  passData: GoogleWalletPassData
): Promise<void> {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;

  if (!issuerId) {
    throw new Error("Google Wallet issuer ID not configured");
  }

  const token = await getGoogleWalletOAuthToken();
  const qrCodeDataUrl = await generateQRCode(passData.cardNumber);
  const cardObject = await createGenericCardObject(passData, issuerId, qrCodeDataUrl);

  const url = `https://walletobjects.googleapis.com/walletobjects/v1/genericObject`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cardObject),
  });

  const responseData = await response.json();

  if (!response.ok) {
    console.error(`Google Wallet API error: ${JSON.stringify(responseData, null, 2)}`);
    throw new Error(`Failed to create Google Wallet pass: ${response.statusText}`);
  }

  const objectId = `${issuerId}.${passData.cardNumber}`;
  console.log(`✅ Google Wallet object created: ${objectId}`);
  console.log(`Response:`, JSON.stringify(responseData, null, 2));
}
