import { PKPass } from "passkit-generator";
import * as fs from "fs";
import * as path from "path";

export interface WaspCardData {
  cardNumber: string;
  userName: string;
  issuedAt: Date;
  expiresAt: Date;
  type: "associated" | "direct";
  associationName?: string;
  userImageUrl?: string;
}

export async function generateWaspCardPass(cardData: WaspCardData): Promise<Buffer> {
  try {
    // Fetch user image if provided
    let userImageBuffer: Buffer | undefined;
    if (cardData.userImageUrl) {
      try {
        const imageResponse = await fetch(cardData.userImageUrl);
        if (imageResponse.ok) {
          const arrayBuffer = await imageResponse.arrayBuffer();
          userImageBuffer = Buffer.from(arrayBuffer);
        }
      } catch (err) {
        console.warn("Failed to fetch user image for pass:", err);
      }
    }

    // Create pass structure
    const pass = new PKPass({
      // Pass type identifier (would need Apple-issued identifier when company cert is ready)
      passTypeIdentifier: "pass.com.wasp.card",
      teamIdentifier: "YOUR_TEAM_ID",
      organizationName: "WASP",
      description: "WASP World Animal Solidarity Project Card",

      // Visual appearance
      backgroundColor: "rgb(0, 0, 0)", // Black background
      foregroundColor: "rgb(255, 206, 0)", // WASP Yellow text
      labelColor: "rgb(255, 206, 0)", // WASP Yellow labels

      // Pass content
      generic: {
        headerFields: [
          {
            key: "cardType",
            label: "WASP CARD",
            value: cardData.type === "associated" ? "ASSOCIATED" : "DIRECT",
          },
        ],
        primaryFields: [
          {
            key: "cardNumber",
            label: "Card Number",
            value: cardData.cardNumber,
            textAlignment: "PKTextAlignmentCenter",
          },
        ],
        secondaryFields: [
          {
            key: "holder",
            label: "Holder",
            value: cardData.userName,
          },
          {
            key: "type",
            label: "Type",
            value: cardData.associationName || "Direct Card",
          },
        ],
        auxiliaryFields: [
          {
            key: "issued",
            label: "Issued",
            value: cardData.issuedAt.toLocaleDateString(),
            dateStyle: "PKDateStyleMedium",
          },
          {
            key: "expires",
            label: "Expires",
            value: cardData.expiresAt.toLocaleDateString(),
            dateStyle: "PKDateStyleMedium",
          },
        ],
        backFields: [
          {
            key: "info",
            label: "Information",
            value: "This is your World Animal Solidarity Project Card. Valid for 1 year from issue date.",
          },
        ],
      },

      // Add barcode (would be QR code with card number + validation hash)
      barcodes: [
        {
          format: "PKBarcodeFormatQR",
          message: cardData.cardNumber,
          messageEncoding: "iso-8859-1",
        },
      ],

      // Expiration
      expirationDate: cardData.expiresAt,
      voided: false,
    });

    // Add user image as thumbnail if available
    if (userImageBuffer) {
      pass.addBuffer("thumbnail", userImageBuffer);
    }

    // TODO: Sign with certificate when Apple provides company cert
    // For now, this is stubbed - we'll update when cert arrives
    // The actual signing would look like:
    // const certificate = fs.readFileSync(path.join(process.cwd(), 'certificates', 'pass.cer'));
    // const wwdrCertificate = fs.readFileSync(path.join(process.cwd(), 'certificates', 'wwdr.cer'));
    // const key = fs.readFileSync(path.join(process.cwd(), 'certificates', 'key.p8'));
    // pass.signingCertificate = certificate;
    // pass.signingCertificatePrivateKey = key;
    // pass.wwdrCertificate = wwdrCertificate;

    // Generate pass (unsigned for now)
    const passBuffer = pass.getAsBuffer();
    return passBuffer;
  } catch (error) {
    console.error("Error generating wallet pass:", error);
    throw error;
  }
}

// Validation helper to verify card pass integrity
export function generateCardValidationHash(cardNumber: string, issuedAt: Date): string {
  // Simple hash for validation (would be more complex in production)
  const data = `${cardNumber}${issuedAt.getTime()}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}
