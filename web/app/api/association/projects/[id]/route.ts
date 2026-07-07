import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const associationId = request.cookies.get("wasp_association_id")?.value;

    if (!associationId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify ownership
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

    if (project.association_id !== associationId) {
      return NextResponse.json(
        { error: "You can only delete your own projects" },
        { status: 403 }
      );
    }

    // Delete project
    const { error: deleteError } = await supabaseAdmin
      .from("association_projects")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
