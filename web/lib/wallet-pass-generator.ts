import { PKPass } from "passkit-generator";
import * as fs from "fs";
import * as path from "path";

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
  try {
    const assetsPath = path.join(process.cwd(), "public", "card-assets");

    // Create pass structure using FRONT image as main visual
    const pass = new PKPass({
      passTypeIdentifier: "pass.com.wasp.card",
      teamIdentifier: "", // Will be updated when Apple cert arrives
      organizationName: "WASP",
      description: `${cardData.userName} - ${cardData.associationName} Card`,
      serialNumber: cardData.cardNumber,

      // Visual appearance (WASP theme: yellow & black)
      backgroundColor: "rgb(0, 0, 0)",
      foregroundColor: "rgb(255, 206, 0)",
      labelColor: "rgb(255, 206, 0)",

      // Pass content
      generic: {
        headerFields: [
          {
            key: "association",
            label: "ASSOCIATION",
            value: cardData.associationName,
            textAlignment: "PKTextAlignmentCenter",
          },
        ],
        primaryFields: [
          {
            key: "holder",
            label: "MEMBER",
            value: cardData.userName,
            textAlignment: "PKTextAlignmentCenter",
          },
        ],
        secondaryFields: [
          {
            key: "location",
            label: "LOCATION",
            value: cardData.associationCity,
          },
        ],
        auxiliaryFields: [
          {
            key: "cardNumber",
            label: "CARD NUMBER",
            value: cardData.cardNumber,
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
            value: new Date(cardData.issuedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          },
          {
            key: "expires",
            label: "Expires",
            value: new Date(cardData.expiresAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          },
          {
            key: "disclaimer",
            label: "Terms",
            value: "This card is non-transferable. Valid only for the named member. Lost or damaged cards must be replaced by contacting the association.",
          },
        ],
      },

      // QR code with card number for scanning
      barcodes: [
        {
          format: "PKBarcodeFormatQR",
          message: cardData.cardNumber,
          messageEncoding: "iso-8859-1",
        },
      ],

      expirationDate: cardData.expiresAt,
      voided: false,
    });

    // Load and set images from card assets
    try {
      // Main strip image (front of card)
      const stripImage = fs.readFileSync(path.join(assetsPath, "FRONT.png"));
      pass.setImage("strip", stripImage, { density: 2 });

      // Logo
      const logoImage = fs.readFileSync(path.join(assetsPath, "logo.png"));
      pass.setImage("logo", logoImage);

      // Wasp icon
      const waspIcon = fs.readFileSync(path.join(assetsPath, "wasp.png"));
      pass.setImage("icon", waspIcon);

      // Background pattern
      const bgImage = fs.readFileSync(path.join(assetsPath, "seamless.png"));
      pass.setImage("background", bgImage);
    } catch (imgError) {
      console.warn("Warning: Some card images could not be loaded:", imgError);
      // Pass generation will continue with missing images
    }

    // Fetch and add user image if provided
    if (cardData.userImageUrl) {
      try {
        const imageResponse = await fetch(cardData.userImageUrl);
        if (imageResponse.ok) {
          const arrayBuffer = await imageResponse.arrayBuffer();
          const userImageBuffer = Buffer.from(arrayBuffer);
          pass.setImage("thumbnail", userImageBuffer);
        }
      } catch (err) {
        console.warn("Failed to fetch user image for pass:", err);
      }
    }

    // Load and sign with Apple certificate if available
    try {
      const certPath = path.join(process.cwd(), "web", "certificates");
      const certFile = path.join(certPath, "wasp.pem");
      const keyFile = path.join(certPath, "wasp.key");

      if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
        const certificate = fs.readFileSync(certFile);
        const privateKey = fs.readFileSync(keyFile);

        // Set signing certificate and key
        pass.signingCertificate = certificate;
        pass.signingCertificatePrivateKey = privateKey;

        // TODO: Add WWDR certificate when obtained from Apple
        // Download from: https://developer.apple.com/certificationauthority/AppleWWDRCA.cer
        // const wwdrFile = path.join(certPath, "AppleWWDRCA.cer");
        // if (fs.existsSync(wwdrFile)) {
        //   pass.wwdrCertificate = fs.readFileSync(wwdrFile);
        // }

        console.log("✅ Wallet pass will be cryptographically signed");
      } else {
        console.warn("⚠️ Certificate files not found - pass will be unsigned");
      }
    } catch (certError) {
      console.warn("Warning: Could not load signing certificate:", certError);
    }

    // Generate and sign pass
    const passBuffer = pass.getAsBuffer();
    return passBuffer;
  } catch (error) {
    console.error("Error generating wallet pass:", error);
    throw error;
  }
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
