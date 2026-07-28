import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
import { Readable } from "stream";

const archiver = require("archiver");

interface PassJson {
  formatVersion: number;
  passTypeIdentifier: string;
  teamIdentifier: string;
  organizationName: string;
  serialNumber: string;
  description: string;
  logoText: string;
  backgroundColor: string;
  foregroundColor: string;
  labelColor: string;
  expirationDate: string;
  generic: {
    headerFields: Array<{ key: string; label: string; value: string }>;
    primaryFields: Array<{ key: string; label: string; value: string; textAlignment?: string }>;
    secondaryFields: Array<{ key: string; label: string; value: string }>;
    auxiliaryFields: Array<{ key: string; label: string; value: string }>;
    backFields: Array<{ key: string; label: string; value: string }>;
  };
  barcodes: Array<{
    format: string;
    message: string;
    messageEncoding: string;
  }>;
}

function createPassJson(cardData: {
  cardNumber: string;
  userName: string;
  issuedAt: Date;
  expiresAt: Date;
  associationName: string;
  associationCity: string;
  userEmail: string;
}): PassJson {
  return {
    formatVersion: 1,
    passTypeIdentifier: "pass.com.wasp.card",
    teamIdentifier: "TEAMID",
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
}

async function createPassKitPackage(passJson: PassJson): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const passJsonString = JSON.stringify(passJson, null, 2);

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    archive.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    archive.on("error", reject);

    // Add pass.json
    archive.append(passJsonString, { name: "pass.json" });

    // Create manifest (SHA1 hashes of all files)
    const manifest: Record<string, string> = {};
    manifest["pass.json"] = createHash("sha1").update(passJsonString).digest("hex");

    const manifestJson = JSON.stringify(manifest);
    archive.append(manifestJson, { name: "manifest.json" });

    // For dev/MVP, create a placeholder signature
    // In production, this needs PKCS#7 signing with a real certificate
    const signature = Buffer.from("DEV_SIGNATURE_PLACEHOLDER");
    archive.append(signature, { name: "signature" });

    archive.finalize();
  });
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Card code required" }, { status: 400 });
    }

    // Look up card in database
    const { data: user, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, nickname, email, unique_membership_code, expires_at, associations(name)")
      .eq("unique_membership_code", code)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const association = Array.isArray(user.associations)
      ? user.associations[0]
      : user.associations;

    // Create pass JSON
    const passJson = createPassJson({
      cardNumber: code,
      userName: user.nickname || user.email,
      issuedAt: new Date(),
      expiresAt: new Date(user.expires_at || Date.now() + 48 * 60 * 60 * 1000),
      associationName: association?.name || "WASP",
      associationCity: "Italy",
      userEmail: user.email,
    });

    // Generate .pkpass file
    const pkpassBuffer = await createPassKitPackage(passJson);

    // Return as download
    return new NextResponse(pkpassBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="WASP-${code}.pkpass"`,
        "Content-Length": pkpassBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Wallet pass error:", error);
    return NextResponse.json({ error: "Failed to generate pass" }, { status: 500 });
  }
}
