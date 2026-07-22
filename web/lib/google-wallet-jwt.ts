import jwt from "jsonwebtoken";

interface GoogleWalletPassData {
  cardNumber: string;
  userName: string;
  issuedAt: Date;
  expiresAt: Date;
  associationName: string;
  associationCity: string;
  userEmail: string;
}

// Class definition (template) - defines how passes look
function createGenericCardClass(issuerId: string) {
  return {
    id: `${issuerId}.wasp_generic_class`,
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData['cardNumber']"
                    }
                  ]
                }
              },
              endItem: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData['organization']"
                    }
                  ]
                }
              }
            }
          }
        ]
      }
    }
  };
}

// Object definition (individual pass instance) - matches Google's required format
function createGenericCardObject(passData: GoogleWalletPassData, issuerId: string) {
  return {
    id: `${issuerId}.wasp_generic_class!${passData.cardNumber}`,
    classId: `${issuerId}.wasp_generic_class`,
    logo: {
      sourceUri: {
        uri: "https://waspnest.org/logo-yellow.png",
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
        value: "WASP Card",
      },
    },
    subheader: {
      defaultValue: {
        language: "en-US",
        value: "Member Card",
      },
    },
    header: {
      defaultValue: {
        language: "en-US",
        value: `${passData.userName}`,
      },
    },
    textModulesData: [
      {
        id: "cardNumber",
        header: "CARD NUMBER",
        body: passData.cardNumber,
      },
      {
        id: "organization",
        header: "ASSOCIATION",
        body: passData.associationName,
      },
    ],
    barcode: {
      type: "QR_CODE",
      value: passData.cardNumber,
      alternateText: passData.cardNumber,
    },
    hexBackgroundColor: "#000000",
    heroImage: {
      sourceUri: {
        uri: "https://waspnest.org/hero-card.png",
      },
      contentDescription: {
        defaultValue: {
          language: "en-US",
          value: "WASP Card Hero Image",
        },
      },
    },
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

  const payload = {
    iss: issuerId,
    aud: "google",
    origins: ["https://waspnest.org"],
    typ: "savetowallet",
    payload: {
      genericClasses: [createGenericCardClass(issuerId)],
      genericObjects: [createGenericCardObject(passData, issuerId)],
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
