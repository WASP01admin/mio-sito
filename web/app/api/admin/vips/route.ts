import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const { data: vips, error } = await supabaseAdmin
    .from("vips")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(vips);
}

export async function POST(request: NextRequest) {
  // Check admin auth
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { first_name, surname, nationality_code, bio, image_url } = body;

  if (!first_name || !surname || !nationality_code || !bio || !image_url) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("vips")
    .insert({
      first_name,
      surname,
      surname_initial: surname.charAt(0).toUpperCase(),
      nationality_code: nationality_code.toUpperCase(),
      bio,
      image_url,
      organization: "WASP HQ",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  // Check admin auth
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, first_name, surname, nationality_code, bio, image_url } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("vips")
    .update({
      first_name,
      surname,
      surname_initial: surname?.charAt(0).toUpperCase(),
      nationality_code: nationality_code?.toUpperCase(),
      bio,
      image_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  // Check admin auth
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("vips").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
