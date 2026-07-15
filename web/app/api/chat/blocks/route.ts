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

    // Get list of blocked users
    const { data: blocks, error } = await supabaseAdmin
      .from("chat_user_blocks")
      .select(
        `
        id,
        blocked_user_id,
        reason,
        created_at,
        blocked_user:user_profiles!blocked_user_id(id, nickname)
      `
      )
      .eq("blocker_id", session.userProfileId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get blocked users failed:", error);
      return NextResponse.json({ error: "Failed to load blocks" }, { status: 500 });
    }

    const blockedUsers = (blocks || []).map((block: any) => ({
      userId: block.blocked_user_id,
      nickname: block.blocked_user?.nickname || "Unknown",
      reason: block.reason,
      blockedAt: block.created_at,
    }));

    return NextResponse.json({ blockedUsers });
  } catch (error) {
    console.error("Blocks API GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const { userId, reason } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    if (userId === session.userProfileId) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    // Block user
    const { error } = await supabaseAdmin.from("chat_user_blocks").insert({
      blocker_id: session.userProfileId,
      blocked_user_id: userId,
      reason: reason || null,
    });

    // Ignore unique constraint violation (already blocked)
    if (error && error.code !== "23505") {
      console.error("Block user failed:", error);
      return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blocks API POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const userId = searchParams.get("userId");

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    // Unblock user
    const { error } = await supabaseAdmin
      .from("chat_user_blocks")
      .delete()
      .eq("blocker_id", session.userProfileId)
      .eq("blocked_user_id", userId);

    if (error) {
      console.error("Unblock user failed:", error);
      return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blocks API DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
