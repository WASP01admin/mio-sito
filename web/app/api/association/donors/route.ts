import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { cookies } from "next/headers";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalStr(value: unknown): string | null {
  const trimmed = str(value);
  return trimmed || null;
}

function optionalNumber(value: unknown): number | null {
  const trimmed = str(value);
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication via cookie
    const cookieStore = await cookies();
    const associationCode = cookieStore.get("association_code")?.value;

    if (!associationCode) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // Get association info from code
    const { data: associationData } = await supabaseAdmin
      .from("associations")
      .select("code, country")
      .eq("code", associationCode)
      .single();

    if (!associationData) {
      return NextResponse.json({ ok: false, error: "association_not_found" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const code = optionalStr(body?.code)?.toUpperCase() ?? null;
    const name = str(body?.name);
    const city = str(body?.city);
    const country = optionalStr(body?.country);
    const address = optionalStr(body?.address);
    const postalCode = optionalStr(body?.postalCode);
    const lat = optionalNumber(body?.lat);
    const lng = optionalNumber(body?.lng);
    const email = optionalStr(body?.email);
    const phone = optionalStr(body?.phone);
    const website = optionalStr(body?.website);

    if (!name || !city) {
      return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
    }

    // Verify that code belongs to association's country
    const associationCountryCode = associationData.code.substring(0, 3);
    if (code && !code.startsWith(associationCountryCode)) {
      return NextResponse.json(
        { ok: false, error: "code_mismatch_with_country" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("donors").insert({
      code,
      name,
      city,
      country,
      address,
      postal_code: postalCode,
      lat,
      lng,
      email,
      phone,
      website,
    });

    if (error) {
      console.error("Create donor failed:", error.message, error.code, error.details);
      console.error("Attempted insert:", { code, name, city, country, lat, lng });
      const isDuplicate = error.code === "23505";
      return NextResponse.json(
        { ok: false, error: isDuplicate ? "duplicate_code" : "server_error", details: error.message },
        { status: isDuplicate ? 409 : 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Donation endpoint error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
