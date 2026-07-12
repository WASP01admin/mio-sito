import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("admin_token")?.value;

    if (!adminToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = supabase
      .from("user_profiles")
      .select(
        `
        id,
        nickname,
        email,
        card_number,
        card_issued_at,
        card_expires_at,
        card_status,
        card_request_type,
        card_payment_id,
        association_id,
        associations (name, code)
      `,
        { count: "exact" }
      )
      .not("card_number", "is", null)
      .order("card_issued_at", { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq("card_status", status);
    }
    if (type) {
      query = query.eq("card_request_type", type);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return Response.json({
      cards: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching cards:", error);
    return Response.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}
