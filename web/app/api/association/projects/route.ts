import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifySessionToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from("association_projects")
      .select("*, associations(code, name, website, extra_details)")
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

    // At least one resource must be selected
    if (
      !needs_online_personnel &&
      !needs_field_personnel &&
      !needs_volunteers &&
      !needs_instruments &&
      !needs_financial
    ) {
      return NextResponse.json(
        { error: "At least one resource type must be selected" },
        { status: 400 }
      );
    }

    // Get association ID from cookie (associations create their own projects)
    const associationId = request.cookies.get("wasp_association_id")?.value || "";

    if (!associationId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    console.log("✅ Creating project with associationId:", associationId.substring(0, 10));

    const { data, error } = await supabaseAdmin
      .from("association_projects")
      .insert({
        association_id: associationId,
        headline,
        description,
        image_url: image_url || null,
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
