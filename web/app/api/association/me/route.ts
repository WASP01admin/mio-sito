import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCode = cookieStore.get("association_code")?.value;

    if (!sessionCode) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { data: association, error } = await supabaseAdmin
      .from("associations")
      .select("code, name, country")
      .eq("code", sessionCode)
      .single();

    if (error || !association) {
      return NextResponse.json({ ok: false, error: "association_not_found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      code: association.code,
      name: association.name,
      country: association.country,
    });
  } catch (err) {
    console.error("Get association me error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
