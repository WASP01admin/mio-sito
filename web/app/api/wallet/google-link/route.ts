import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ISSUER_ID = "3388000000023172631";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return Response.json({ ok: false, error: "missing_code" }, { status: 400 });
    }

    // Query by unique_membership_code (not card_number)
    const { data: user, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("unique_membership_code", code)
      .single();

    if (error || !user) {
      return Response.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const credentialsPath = path.join(process.cwd(), "service-account-key.json");
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));

    const passClaims = {
      iss: credentials.client_email,
      aud: "google",
      origins: [],
      typ: "savetowallet",
      payload: {
        genericClasses: [{
          id: `${ISSUER_ID}.wasp_card_class`,
          classTemplateInfo: {
            cardTemplateOverride: {
              fieldTemplateOverride: {
                textColor: "#FFFFFF",
                cardBackgroundColor: "#4CAF50"
              }
            }
          }
        }],
        genericObjects: [{
          id: `${ISSUER_ID}.${code}`,
          classId: `${ISSUER_ID}.wasp_card_class`,
          state: "ACTIVE",
          cardTitle: { defaultValue: { language: "en-US", value: "WASP Card" } },
          header: { defaultValue: { language: "en-US", value: user.nickname || user.email } }
        }]
      }
    };

    const token = jwt.sign(passClaims, credentials.private_key, { algorithm: "RS256" });
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    return Response.json({ ok: true, saveUrl }, { status: 200 });
  } catch (error) {
    console.error("Wallet error:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
