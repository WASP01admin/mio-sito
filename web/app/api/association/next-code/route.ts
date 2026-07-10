import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const associationCode = cookieStore.get("association_code")?.value;

    if (!associationCode) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const countryCode = associationCode.substring(0, 3);
    const { searchParams } = new URL(request.url);
    const queryCountryCode = searchParams.get("countryCode");

    // Ensure association can only generate codes for their own country
    if (queryCountryCode !== countryCode) {
      return NextResponse.json(
        { ok: false, error: "Country code mismatch" },
        { status: 403 }
      );
    }

    // Find highest existing number for this country code
    const { data } = await supabaseAdmin
      .from("donors")
      .select("code")
      .like("code", `${countryCode}%`)
      .order("code", { ascending: false })
      .limit(1);

    let nextNumber = 10;
    if (data && data.length > 0) {
      const lastCode = data[0].code;
      const numberPart = lastCode.substring(3);
      const lastNumber = parseInt(numberPart, 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const nextCode = `${countryCode}${String(nextNumber).padStart(4, "0")}`;

    // Validate code doesn't already exist
    const { data: existing } = await supabaseAdmin
      .from("donors")
      .select("code")
      .eq("code", nextCode)
      .single();

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Code already exists, try again" },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true, code: nextCode });
  } catch (err) {
    console.error("Next code error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
