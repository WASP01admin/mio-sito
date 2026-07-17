export interface WaspCardData {
  cardNumber: string;
  userName: string;
  issuedAt: Date;
  expiresAt: Date;
  associationName: string;
  associationCity: string;
  userEmail: string;
  userImageUrl?: string;
}

export async function generateWaspCardPass(cardData: WaspCardData): Promise<Buffer> {
  // Temporary: Return a simple test pass structure
  // In production, this would use passkit-generator properly

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: "pass.com.wasp.card",
    teamIdentifier: "TEAMID", // Replace with your Apple Team ID
    organizationName: "WASP",
    serialNumber: cardData.cardNumber,
    description: `WASP Card - ${cardData.userName}`,
    logoText: "WASP",
    backgroundColor: "rgb(0, 0, 0)",
    foregroundColor: "rgb(255, 206, 0)",
    labelColor: "rgb(255, 206, 0)",
    expirationDate: cardData.expiresAt.toISOString(),
    generic: {
      headerFields: [
        {
          key: "cardType",
          label: "CARD",
          value: "WASP Membership",
        },
      ],
      primaryFields: [
        {
          key: "cardNumber",
          label: "CARD NUMBER",
          value: cardData.cardNumber,
          textAlignment: "center",
        },
      ],
      secondaryFields: [
        {
          key: "holder",
          label: "MEMBER",
          value: cardData.userName,
        },
        {
          key: "association",
          label: "ASSOCIATION",
          value: cardData.associationName,
        },
      ],
      auxiliaryFields: [
        {
          key: "location",
          label: "LOCATION",
          value: cardData.associationCity,
        },
      ],
      backFields: [
        {
          key: "email",
          label: "Email",
          value: cardData.userEmail,
        },
        {
          key: "issued",
          label: "Issued",
          value: cardData.issuedAt.toLocaleDateString(),
        },
        {
          key: "expires",
          label: "Expires",
          value: cardData.expiresAt.toLocaleDateString(),
        },
      ],
    },
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: cardData.cardNumber,
        messageEncoding: "iso-8859-1",
      },
    ],
  };

  // For now, return JSON (proper implementation needs passkit-generator fix)
  return Buffer.from(JSON.stringify(passJson));
}

export function generateCardValidationHash(cardNumber: string, issuedAt: Date): string {
  const data = `${cardNumber}${issuedAt.getTime()}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
