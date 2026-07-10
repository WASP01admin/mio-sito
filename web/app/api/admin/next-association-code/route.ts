import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const countryCode = searchParams.get("countryCode")?.toUpperCase();

  if (!countryCode || countryCode.length !== 3) {
    return NextResponse.json(
      { ok: false, error: "invalid_country_code" },
      { status: 400 }
    );
  }

  try {
    // Get the highest existing number for this country code
    const { data, error } = await supabaseAdmin
      .from("associations")
      .select("code")
      .ilike("code", `${countryCode}%`)
      .order("code", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { ok: false, error: "database_error" },
        { status: 500 }
      );
    }

    let nextNumber = 10;

    if (data && data.length > 0) {
      // Extract number from code (e.g., "ITA0123" -> 123)
      const lastCode = data[0].code;
      const lastNumber = parseInt(lastCode.slice(3), 10);

      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Validate: number must not exceed 4 digits (0000-9999)
    if (nextNumber > 9999) {
      return NextResponse.json(
        { ok: false, error: "code_limit_exceeded", message: `Maximum codes reached for ${countryCode}. Limit is 10,000 (0010-9999). Found ${nextNumber} codes already exist.` },
        { status: 409 }
      );
    }

    // Format with leading zeros (0010, 0011, etc.)
    const nextCode = `${countryCode}${String(nextNumber).padStart(4, "0")}`;

    // Validate code doesn't exist (extra safety)
    const { data: checkData } = await supabaseAdmin
      .from("associations")
      .select("id")
      .eq("code", nextCode)
      .single();

    if (checkData) {
      return NextResponse.json(
        { ok: false, error: "code_already_exists" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      code: nextCode,
      countryCode,
      nextNumber,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
