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
    // Get count of existing codes to estimate the next number
    const { count, error: countError } = await supabaseAdmin
      .from("associations")
      .select("code", { count: "exact", head: true })
      .ilike("code", `${countryCode}%`);

    if (countError) {
      console.error("Count error:", countError);
      return NextResponse.json(
        { ok: false, error: "database_error" },
        { status: 500 }
      );
    }

    // Fetch all codes for this country to find actual max (handles pagination)
    let allCodes: string[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabaseAdmin
        .from("associations")
        .select("code")
        .ilike("code", `${countryCode}%`)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error("Fetch error:", error);
        return NextResponse.json(
          { ok: false, error: "database_error" },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) break;
      allCodes = allCodes.concat(data.map(d => d.code));

      if (data.length < pageSize) break;
      page++;
    }

    // Find the actual max numeric value
    let nextNumber = 10;
    if (allCodes.length > 0) {
      const numbers = allCodes
        .map(code => parseInt(code.slice(3), 10))
        .filter(num => !isNaN(num));

      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }

    // Validate: number must not exceed 4 digits (0000-9999)
    if (nextNumber > 9999) {
      return NextResponse.json(
        { ok: false, error: "code_limit_exceeded", message: `Maximum codes reached for ${countryCode}. Limit is 10,000 (0010-9999).` },
        { status: 409 }
      );
    }

    // Format with leading zeros (0010, 0011, etc.)
    const nextCode = `${countryCode}${String(nextNumber).padStart(4, "0")}`;

    // Verify code doesn't exist (safety check)
    const { data: checkData } = await supabaseAdmin
      .from("associations")
      .select("id")
      .eq("code", nextCode);

    if (checkData && checkData.length > 0) {
      // Collision - shouldn't happen, but retry just in case
      const retryNumber = nextNumber + 1;
      if (retryNumber > 9999) {
        return NextResponse.json(
          { ok: false, error: "code_limit_exceeded" },
          { status: 409 }
        );
      }
      const retryCode = `${countryCode}${String(retryNumber).padStart(4, "0")}`;
      return NextResponse.json({
        ok: true,
        code: retryCode,
        countryCode,
        nextNumber: retryNumber,
      });
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
