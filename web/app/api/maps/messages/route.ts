import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyChatSessionToken } from "";
import { chatAuthSecret } from "@/lib/chat";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const markerId = searchParams.get("markerId");

  if (!type || !markerId) {
    return NextResponse.json(
      { error: "Missing type or markerId" },
      { status: 400 }
    );
  }

  // Get messages for this marker, including user info
  const { data: messages, error } = await supabaseAdmin
    .from("map_messages")
    .select(
      `
      id,
      message_text,
      created_at,
      parent_message_id,
      user_profiles(nickname, id)
    `
    )
    .eq("marker_type", type)
    .eq("marker_id", markerId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }

  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(request: NextRequest) {
  const { type, markerId, message, parentMessageId } = await request.json();

  if (!type || !markerId || !message) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Check auth: must be WASP Card holder OR Association (via their private area)
  // For now, require WASP Card (chat session token)
  const cookies = request.headers.get("cookie") || "";
  const tokenMatch = cookies.match(/wasp_chat_session=([^;]+)/);
  const token = tokenMatch?.[1];

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized - WASP Card required" },
      { status: 401 }
    );
  }

  const payload = verifyChatSessionToken(token, chatAuthSecret());
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  // Trim and validate message
  const trimmedMessage = (message as string).trim();
  if (!trimmedMessage || trimmedMessage.length > 1000) {
    return NextResponse.json(
      { error: "Message must be 1-1000 characters" },
      { status: 400 }
    );
  }

  // Insert message
  const { data, error } = await supabaseAdmin
    .from("map_messages")
    .insert({
      marker_type: type,
      marker_id: markerId,
      user_profile_id: payload.userProfileId,
      message_text: trimmedMessage,
      parent_message_id: parentMessageId || null,
    })
    .select("id, message_text, created_at, user_profiles(nickname, id)")
    .single();

  if (error) {
    console.error("Failed to insert message:", error);
    return NextResponse.json(
      { error: "Failed to post message" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
