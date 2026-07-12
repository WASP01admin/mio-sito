import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("association_token")?.value;

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    const associationId = decoded.association_id;

    // Get the image to verify ownership and get the URL
    const { data: image, error: fetchError } = await supabase
      .from("association_images")
      .select("*")
      .eq("id", params.id)
      .eq("association_id", associationId)
      .single();

    if (fetchError || !image) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete from storage
    if (image.url) {
      const fileName = image.url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("association-images").remove([fileName]);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from("association_images")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return Response.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
