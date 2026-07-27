import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // TODO: Add admin authentication check

    const { data: cards, error } = await supabase
      .from("business_cards")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Query error:", error);
      return Response.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    return Response.json({ ok: true, cards }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
