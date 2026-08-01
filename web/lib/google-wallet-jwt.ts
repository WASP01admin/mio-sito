import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";

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

// Load credentials from file (not base64 from env)
function loadCredentials() {
  const credentialsPath = path.join(process.cwd(), "service-account-key.json");
  
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Google Wallet credentials file not found at ${credentialsPath}`);
  }

  const credentialsJson = fs.readFileSync(credentialsPath, "utf-8");
  return JSON.parse(credentialsJson);
}

async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data);
  } catch (error) {
    console.error("QR code generation error:", error);
    throw new Error("Failed to generate QR code");
  }
}

export async function generateGoogleWalletJwt(
  passData: GoogleWalletPassData
): Promise<string> {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  if (!issuerId) {
    throw new Error("Google Wallet issuer ID not configured");
  }

  try {
    const credentials = loadCredentials();
    const privateKey = credentials.private_key;

    if (!privateKey) {
      throw new Error("Private key not found in credentials");
    }

    // Create JWT claims for Google Wallet save URL
    const claims = {
      iss: credentials.client_email,
      aud: "google",
      typ: "savetowallet",
      payload: {
        genericObjects: [
          {
            id: `${issuerId}.${passData.cardNumber}`,
            classId: `${issuerId}.wasp_card`,
            genericType: "GENERIC_TYPE_UNSPECIFIED",
            hexBackgroundColor: "#4CAF50",
            logo: {
              sourceUri: {
                uri: "https://www.gstatic.com/wallet/generic/logo_dark.png",
              },
            },
            cardTitle: {
              defaultValue: {
                language: "en-US",
                value: passData.associationName,
              },
            },
            subheader: {
              defaultValue: {
                language: "en-US",
                value: passData.userName,
              },
            },
            header: {
              defaultValue: {
                language: "en-US",
                value: "WASP Card",
              },
            },
            textModules: [
              {
                header: "Card Number",
                body: passData.cardNumber,
              },
              {
                header: "Email",
                body: passData.userEmail,
              },
            ],
          },
        ],
      },
    };

    // Sign JWT with RS256 using the private key directly
    const token = jwt.sign(claims, privateKey, {
      algorithm: "RS256",
    });

    return token;
  } catch (error) {
    console.error("JWT generation error:", error);
    throw new Error(
      `Failed to generate Google Wallet JWT: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export function getGoogleWalletSaveUrl(jwt: string): string {
  return `https://pay.google.com/gp/v/save/${jwt}`;
}
