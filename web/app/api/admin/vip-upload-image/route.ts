import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { randomUUID } from "crypto";

const VIP_IMAGE_BUCKET = "vip-images";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  // Check admin auth
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image") as File;
  const vipId = formData.get("vipId") as string;

  if (!file || !vipId) {
    return NextResponse.json(
      { error: "Missing file or vipId" },
      { status: 400 }
    );
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Image exceeds 10MB size limit" },
      { status: 400 }
    );
  }

  try {
    const buffer = await file.arrayBuffer();
    const extension = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf("."))
      : ".jpg";
    const path = `${randomUUID()}${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(VIP_IMAGE_BUCKET)
      .upload(path, buffer, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabaseAdmin.storage
      .from(VIP_IMAGE_BUCKET)
      .getPublicUrl(path);

    // Update VIP with new image URL
    const { error: updateError } = await supabaseAdmin
      .from("vips")
      .update({ image_url: publicUrl.publicUrl })
      .eq("id", vipId);

    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      imageUrl: publicUrl.publicUrl,
    });
  } catch (error) {
    console.error("VIP image upload failed:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
