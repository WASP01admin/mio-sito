import { NextRequest, NextResponse } from "next/server";
import { verifyChatSessionToken } from "";
import { chatAuthSecret } from "@/lib/chat";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { chatImagePublicUrl, uploadChatImage } from "@/lib/storage";

// The client already holds its chat session token (issued at /api/chat/enter)
// to authenticate the socket -- reused here as a Bearer token since this is
// a plain HTTP upload, not a socket event.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const payload = verifyChatSessionToken(token, chatAuthSecret());

  if (!payload) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data: ban } = await supabaseAdmin
    .from("chat_bans")
    .select("id")
    .eq("user_profile_id", payload.userProfileId)
    .maybeSingle();

  if (ban) {
    return NextResponse.json({ ok: false, error: "banned" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }

  try {
    const path = await uploadChatImage(file, payload.userProfileId);
    return NextResponse.json({ ok: true, imagePath: path, imageUrl: chatImagePublicUrl(path) });
  } catch (error) {
    console.error("Chat image upload failed:", error);
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
