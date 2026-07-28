import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add admin authentication check

    const { id } = await context.params;
    const { status } = await request.json();

    if (!["active", "suspended", "rejected", "pending"].includes(status)) {
      return Response.json(
        { ok: false, error: "invalid_status" },
        { status: 400 }
      );
    }

    const { data: card, error: updateError } = await supabase
      .from("business_cards")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return Response.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    return Response.json({ ok: true, card }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add admin authentication check

    const { id } = await context.params;
    const { error: deleteError } = await supabase
      .from("business_cards")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return Response.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
