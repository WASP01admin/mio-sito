import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyChatSessionToken } from "@/lib/chat";

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("wasp_chat_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifyChatSessionToken(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");

    if (action === "history" && userId) {
      // Get DM history with a specific user
      const { data: messages, error } = await supabaseAdmin
        .from("chat_direct_messages")
        .select(
          `
          id,
          sender_id,
          recipient_id,
          body,
          image_path,
          created_at,
          sender:user_profiles!sender_id(nickname)
        `
        )
        .or(
          `and(sender_id.eq.${session.userProfileId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${session.userProfileId})`
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) {
        console.error("Get DM history failed:", error);
        return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
      }

      return NextResponse.json({ messages: messages || [] });
    }

    if (action === "conversations") {
      // Get list of active DM conversations for this user
      const { data: conversations, error } = await supabaseAdmin
        .from("chat_direct_messages")
        .select(
          `
          id,
          sender_id,
          recipient_id,
          body,
          created_at,
          sender:user_profiles!sender_id(id, nickname),
          recipient:user_profiles!recipient_id(id, nickname)
        `
        )
        .or(`sender_id.eq.${session.userProfileId},recipient_id.eq.${session.userProfileId}`)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Get DM conversations failed:", error);
        return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
      }

      // Group by conversation partner and get last message
      const conversationsMap = new Map<
        string,
        {
          partnerId: string;
          partnerNickname: string;
          lastMessage: string;
          lastMessageAt: string;
        }
      >();

      for (const msg of conversations || []) {
        const otherId =
          msg.sender_id === session.userProfileId ? msg.recipient_id : msg.sender_id;
        const otherNickname =
          msg.sender_id === session.userProfileId ? msg.recipient?.nickname : msg.sender?.nickname;

        if (!conversationsMap.has(otherId)) {
          conversationsMap.set(otherId, {
            partnerId: otherId,
            partnerNickname: otherNickname || "Unknown",
            lastMessage: msg.body || "[Image]",
            lastMessageAt: msg.created_at,
          });
        }
      }

      return NextResponse.json({
        conversations: Array.from(conversationsMap.values()),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("DM API route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
