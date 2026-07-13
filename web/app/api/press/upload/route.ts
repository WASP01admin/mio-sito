import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const press_id = formData.get("press_id") as string;

    if (!file || !press_id) {
      return NextResponse.json(
        { error: "File and press_id required" },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const filename = `${press_id}/${timestamp}-${file.name}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("press-images")
      .upload(filename, file);

    if (error) {
      console.error("Storage error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("press-images")
      .getPublicUrl(filename);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
