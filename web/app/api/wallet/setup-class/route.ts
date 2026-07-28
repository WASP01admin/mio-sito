import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const GOOGLE_WALLET_API = "https://walletobjects.googleapis.com/walletobjects/v1";

async function setupClass(request: NextRequest) {
  try {
    const credentialsB64 = process.env.GOOGLE_WALLET_CREDENTIALS_B64;
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;

    if (!credentialsB64 || !issuerId) {
      return NextResponse.json(
        { error: "Missing Google Wallet credentials" },
        { status: 400 }
      );
    }

    // Decode credentials
    const credentialsJson = Buffer.from(credentialsB64, "base64").toString("utf-8");
    const credentials = JSON.parse(credentialsJson);

    // Generate access token using service account
    const accessToken = jwt.sign(
      {
        iss: credentials.client_email,
        scope: "https://www.googleapis.com/auth/wallet_object.issuer",
        aud: "https://oauth2.googleapis.com/token",
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      credentials.private_key,
      { algorithm: "RS256" }
    );

    // Get OAuth2 token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: accessToken,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("OAuth error:", tokenData);
      console.error("Token response status:", tokenResponse.status);
      return NextResponse.json(
        {
          error: "Failed to get OAuth token",
          details: tokenData,
          status: tokenResponse.status
        },
        { status: 500 }
      );
    }

    // Create generic class definition (EXACTLY as Google specified)
    const classDefinition = {
      id: `${issuerId}.generic_class`,
      classTemplateInfo: {
        cardTemplateOverride: {
          cardRowTemplateInfos: [
            {
              twoItems: {
                startItem: {
                  firstValue: {
                    fields: [
                      {
                        fieldPath: "object.textModulesData['cardNumber']",
                      },
                    ],
                  },
                },
                endItem: {
                  firstValue: {
                    fields: [
                      {
                        fieldPath: "object.textModulesData['expiry']",
                      },
                    ],
                  },
                },
              },
            },
            {
              twoItems: {
                startItem: {
                  firstValue: {
                    fields: [
                      {
                        fieldPath: "object.textModulesData['association']",
                      },
                    ],
                  },
                },
                endItem: {
                  firstValue: {
                    fields: [
                      {
                        fieldPath: "object.textModulesData['city']",
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    };

    // Create the class in Google Wallet
    const classResponse = await fetch(
      `${GOOGLE_WALLET_API}/genericClass/${issuerId}.generic_class`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(classDefinition),
      }
    );

    const classData = await classResponse.json();

    if (!classResponse.ok) {
      console.error("Google Wallet API error:", classData);
      return NextResponse.json(
        { error: "Failed to create class", details: classData },
        { status: 500 }
      );
    }

    console.log("✅ Generic class created successfully:", classData.id);

    return NextResponse.json({
      ok: true,
      message: "Generic class created successfully",
      classId: classData.id,
    });
  } catch (error) {
    console.error("Setup class error:", error);
    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return setupClass(request);
}

export async function POST(request: NextRequest) {
  return setupClass(request);
}
