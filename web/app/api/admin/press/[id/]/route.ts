import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function verifyAdminToken(request: NextRequest) {
  const adminToken = request.headers.get("X-Admin-Token");
  return adminToken === process.env.ADMIN_SECRET_KEY;
}

// UPDATE: Verify, disable, or update publisher
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await verifyAdminToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, verified, password } = await request.json();
    const { id } = params;

    let updateData: any = {};

    if (action === "toggle-verify") {
      updateData.verified = verified;
    } else if (action === "reset-password") {
      updateData.password = password || "press123";
    }

    const { data, error } = await supabaseAdmin
      .from("press")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Press update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      publisher: data,
    });
  } catch (error) {
    console.error("Admin press action error:", error);
    return NextResponse.json(
      { error: "Action failed" },
      { status: 500 }
    );
  }
}

// DELETE: Remove publisher
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await verifyAdminToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;

    // First delete all articles from this publisher
    const { error: articlesError } = await supabaseAdmin
      .from("press_articles")
      .delete()
      .eq("press_id", id);

    if (articlesError) {
      console.error("Articles delete error:", articlesError);
    }

    // Then delete the publisher
    const { error: publisherError } = await supabaseAdmin
      .from("press")
      .delete()
      .eq("id", id);

    if (publisherError) {
      console.error("Press delete error:", publisherError);
      return NextResponse.json(
        { error: publisherError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Publisher deleted",
    });
  } catch (error) {
    console.error("Admin press delete error:", error);
    return NextResponse.json(
      { error: "Deletion failed" },
      { status: 500 }
    );
  }
}
