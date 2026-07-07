import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

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
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const code = str(body?.code).toUpperCase();
  const name = str(body?.name);
  const city = str(body?.city);
  const country = optionalStr(body?.country);
  const address = optionalStr(body?.address);
  const postalCode = optionalStr(body?.postalCode);
  const lat = optionalNumber(body?.lat);
  const lng = optionalNumber(body?.lng);
  const email = optionalStr(body?.email);
  const emailSecondary = optionalStr(body?.emailSecondary);
  const phone = optionalStr(body?.phone);
  const website = optionalStr(body?.website);
  const facebookUrl = optionalStr(body?.facebookUrl);
  const contactPerson = optionalStr(body?.contactPerson);
  const notes1 = optionalStr(body?.notes1);
  const notes2 = optionalStr(body?.notes2);

  if (code.length !== 7 || !name || !city) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("associations").insert({
    code,
    name,
    city,
    country,
    address,
    postal_code: postalCode,
    lat,
    lng,
    email,
    email_secondary: emailSecondary,
    phone,
    website,
    facebook_url: facebookUrl,
    contact_person: contactPerson,
    notes_1: notes1,
    notes_2: notes2,
  });

  if (error) {
    console.error("Create association failed:", error);
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { ok: false, error: isDuplicate ? "duplicate_code" : "server_error" },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
