import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("association_token")?.value;

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    const associationId = decoded.association_id;

    // Get association info
    const { data: assoc } = await supabase
      .from("associations")
      .select("name")
      .eq("id", associationId)
      .single();

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    // Upload to storage
    const fileName = `${Date.now()}-${imageFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("association-images")
      .upload(fileName, imageFile);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("association-images")
      .getPublicUrl(fileName);

    // Save to database
    const { data, error } = await supabase
      .from("association_images")
      .insert({
        association_id: associationId,
        association_name: assoc?.name || "Unknown",
        url: urlData.publicUrl,
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ ok: true, image: data });
  } catch (error) {
    console.error("Error uploading image:", error);
    return Response.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
