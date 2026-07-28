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
  passData: GoogleWalletPassData
): Promise<string> {
  const credentialsB64 = process.env.GOOGLE_WALLET_CREDENTIALS_B64;
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;

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

  const payload = {
    iss: issuerId,
    aud: "google",
    origins: ["https://waspnest.org"],
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
