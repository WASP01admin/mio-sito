import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifySessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const {
      headline,
      description,
      image_url,
      needs_online_personnel,
      needs_online_personnel_details,
      needs_field_personnel,
      needs_field_personnel_details,
      needs_volunteers,
      needs_volunteers_details,
      needs_instruments,
      needs_instruments_details,
      needs_financial,
      needs_financial_details,
      financial_target,
    } = body;

    if (!headline || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify ownership - check if user owns this project
    const { data: project, error: fetchError } = await supabaseAdmin
      .from("association_projects")
      .select("association_id")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get association ID from cookie to verify ownership
    const associationId = request.cookies.get("wasp_association_id")?.value || "";

    if (project.association_id !== associationId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const updateData: any = {
      headline,
      description,
      needs_online_personnel: needs_online_personnel || false,
      needs_online_personnel_details: needs_online_personnel_details || null,
      needs_field_personnel: needs_field_personnel || false,
      needs_field_personnel_details: needs_field_personnel_details || null,
      needs_volunteers: needs_volunteers || false,
      needs_volunteers_details: needs_volunteers_details || null,
      needs_instruments: needs_instruments || false,
      needs_instruments_details: needs_instruments_details || null,
      needs_financial: needs_financial || false,
      needs_financial_details: needs_financial_details || null,
      financial_target: financial_target || null,
    };

    if (image_url) {
      updateData.image_url = image_url;
    }

    const { data, error } = await supabaseAdmin
      .from("association_projects")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error updating project:", error);
    const message = error instanceof Error ? error.message : "Failed to update project";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Verify project exists
    const { data: project, error: fetchError } = await supabaseAdmin
      .from("association_projects")
      .select("association_id")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if user is admin (verify admin session token)
    const adminSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const isAdmin = verifySessionToken(adminSession);

    console.log("🔍 DELETE Project Auth Check:");
    console.log("  Admin session:", !!adminSession);
    console.log("  Is admin:", isAdmin);
    console.log("  Project association:", project.association_id);

    // If not admin, verify ownership
    if (!isAdmin) {
      const associationId = request.cookies.get("wasp_association_id")?.value || "";
      console.log("  User association:", associationId);
      if (project.association_id !== associationId) {
        return NextResponse.json(
          { error: "Unauthorized - not admin and no ownership" },
          { status: 403 }
        );
      }
    }

    const { error } = await supabaseAdmin
      .from("association_projects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ Supabase delete error:", error);
      return NextResponse.json(
        { error: `Delete failed: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("✅ Project deleted successfully");
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("💥 Error deleting project:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Delete error: ${msg}` },
      { status: 500 }
    );
  }
}
