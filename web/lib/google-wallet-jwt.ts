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

function createGenericCardObject(passData: GoogleWalletPassData, issuerId: string) {
  return {
    classId: `${issuerId}!generic_class`,
    objectId: `${issuerId}!${passData.cardNumber}`,
    genericType: "GENERIC_TYPE_UNSPECIFIED",
    hexBackgroundColor: "#000000",
    logo: {
      sourceUri: {
        uri: "https://waspnest.org/logo-yellow.png",
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
        header: "ORGANIZATION",
        body: passData.associationName,
      },
    ],
    expiryDate: {
      date: passData.expiresAt.toISOString().split("T")[0],
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
