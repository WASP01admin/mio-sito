import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifySessionToken } from "@/lib/admin-auth";
import { ASSOCIATION_SESSION_COOKIE } from "@/lib/association-auth";

export async function GET(request: NextRequest) {
  try {
    // Get all events (public view)
    const { data, error } = await supabaseAdmin
      .from("association_events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { headline, description, image_url, event_date } = body;

    if (!headline || !description || !event_date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if admin
    const adminToken = request.cookies.get("wasp_admin_session")?.value;
    const isAdmin = adminToken ? verifySessionToken(adminToken) : false;

    console.log("Event creation - isAdmin:", isAdmin, "adminToken:", !!adminToken);

    let associationId: string;

    if (isAdmin) {
      // Admin events are created as WASP - look up the UUID
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

    console.log("Creating event with associationId:", associationId);

    const { data, error } = await supabaseAdmin
      .from("association_events")
      .insert({
        association_id: associationId,
        headline,
        description,
        image_url: image_url || null,
        event_date,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    const message = error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
