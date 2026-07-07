import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifySessionToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from("association_projects")
      .select("*, associations(code, name)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { headline, description, image_url } = body;

    if (!headline || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if admin
    const adminToken = request.cookies.get("wasp_admin_session")?.value;
    const isAdmin = adminToken ? verifySessionToken(adminToken) : false;

    console.log("Project creation - isAdmin:", isAdmin, "adminToken:", !!adminToken);

    let associationId: string;

    if (isAdmin) {
      // Admin projects are created as WASP - look up the UUID
      const { data: wasp, error: waspError } = await supabaseAdmin
        .from("associations")
        .select("id")
        .eq("code", "ITAWASP")
        .single();

      if (waspError || !wasp) {
        console.error("Could not find ITAWASP association:", waspError);
        return NextResponse.json(
          { error: "WASP association not found" },
          { status: 500 }
        );
      }

      associationId = wasp.id;
    } else {
      // Get association ID from cookie (should be UUID)
      associationId = request.cookies.get("wasp_association_id")?.value || "";

      if (!associationId) {
        return NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
        );
      }
    }

    console.log("Creating project with associationId:", associationId);

    const { data, error } = await supabaseAdmin
      .from("association_projects")
      .insert({
        association_id: associationId,
        headline,
        description,
        image_url: image_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    const message = error instanceof Error ? error.message : "Failed to create project";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
