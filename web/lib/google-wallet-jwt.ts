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

function createGenericCardObject(passData: GoogleWalletPassData) {
  return {
    classId: `${process.env.GOOGLE_WALLET_ISSUER_ID}!generic_class`,
    objectId: `${process.env.GOOGLE_WALLET_ISSUER_ID}!${passData.cardNumber}`,
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
      {
        id: "email",
        header: "EMAIL",
        body: passData.userEmail,
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
  const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;

  if (!privateKey || !issuerId) {
    throw new Error("Google Wallet credentials not configured");
  }

  const payload = {
    iss: `wasp-card-issuer@${issuerId}.iam.gserviceaccount.com`,
    aud: "google",
    origins: ["https://waspnest.org"],
    typ: "savetowallet",
    payload: {
      genericObjects: [createGenericCardObject(passData)],
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
