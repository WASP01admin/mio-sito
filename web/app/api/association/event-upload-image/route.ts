import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { randomUUID } from "crypto";

const BUCKET = "association-events";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image exceeds 10MB size limit" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const extension = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf("."))
      : ".jpg";
    const path = `${randomUUID()}${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({
      ok: true,
      imageUrl: publicUrl.publicUrl,
    });
  } catch (error) {
    console.error("Image upload failed:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
