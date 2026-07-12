import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface GoogleWalletCardData {
  cardNumber: string;
  userName: string;
  issuedAt: Date;
  expiresAt: Date;
  type: "associated" | "direct";
  associationName?: string;
  userImageUrl?: string;
}

export async function generateGoogleWalletPass(
  cardData: GoogleWalletCardData
): Promise<Buffer> {
  try {
    // Create the pass JSON structure for Google Wallet
    const passJson = {
      formatVersion: 1,
      kind: "walletobjects#genericObject",
      id: `${cardData.cardNumber}-${Date.now()}`,
      classId: "3388000000000000001",
      classReference: {
        id: "3388000000000000001",
        kind: "walletobjects#genericClass",
        issuerName: "WASP",
        cardTitle: {
          defaultValue: {
            language: "en",
            value: "WASP Card",
          },
          translatedValues: [
            {
              language: "it",
              value: "Tessera WASP",
            },
          ],
        },
        description: "World Animal Solidarity Project Card",
        reviewStatus: "approved",
        textModulesData: [
          {
            header: "Association",
            body: cardData.associationName || "WASP",
            id: "association",
          },
          {
            header: "Card Type",
            body: cardData.type === "associated" ? "Associated (Free)" : "Direct (€2.00)",
            id: "cardtype",
          },
          {
            header: "Card Number",
            body: cardData.cardNumber,
            id: "cardnumber",
          },
          {
            header: "Member",
            body: cardData.userName,
            id: "member",
          },
          {
            header: "Valid Until",
            body: cardData.expiresAt.toLocaleDateString(),
            id: "expiration",
          },
        ],
        backButton: {
          targetModule: "linksModule",
        },
        hexBackgroundColor: "#000000",
      },
      genericType: "GENERIC_TYPE_UNSPECIFIED",
      heroImage: {
        kind: "walletobjects#image",
        sourceUri: {
          kind: "walletobjects#uri",
          uri: "https://www.gstatic.com/wallet/image/issuers/generic_issuers/generic_icon.png",
          description: "WASP Card",
        },
      },
      barcode: {
        kind: "walletobjects#barcode",
        type: "QR_CODE",
        value: cardData.cardNumber,
        alternateText: cardData.cardNumber,
      },
      cardTitle: {
        defaultValue: {
          language: "en",
          value: "WASP Card",
        },
      },
      subheader: {
        defaultValue: {
          language: "en",
          value: cardData.associationName || "WASP",
        },
      },
      header: {
        defaultValue: {
          language: "en",
          value: cardData.userName,
        },
      },
    };

    // Convert to JSON and create buffer
    const passJsonString = JSON.stringify(passJson);
    const buffer = Buffer.from(passJsonString);

    return buffer;
  } catch (error) {
    console.error("Error generating Google Wallet pass:", error);
    throw error;
  }
}

// Detect if user agent is Android
export function isAndroidUserAgent(userAgent: string): boolean {
  return /Android/i.test(userAgent);
}

// Detect if user agent is iOS
export function isIOSUserAgent(userAgent: string): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent);
}
