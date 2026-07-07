import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// This endpoint cleans up chat images older than 2 days
// Can be called by a cron service (e.g., EasyCron, Supabase functions, etc.)
// Requires CLEANUP_SECRET header to prevent abuse
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cleanup-secret");
  const expectedSecret = process.env.CLEANUP_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all files older than 2 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const { data: oldFiles, error: queryError } = await supabaseAdmin
      .from("chat_image_uploads")
      .select("file_path")
      .lt("uploaded_at", twoDaysAgo);

    if (queryError) throw queryError;

    let deletedCount = 0;
    let freedBytes = 0;

    // Delete files from storage
    if (oldFiles && oldFiles.length > 0) {
      const filePaths = oldFiles.map(f => f.file_path);

      const { error: deleteError } = await supabaseAdmin.storage
        .from("chat-images")
        .remove(filePaths);

      if (deleteError) {
        console.warn("Some files could not be deleted from storage:", deleteError);
        // Continue anyway - we'll still clean up the DB records
      }

      deletedCount = oldFiles.length;
    }

    // Get total bytes freed
    const { data: stats, error: statsError } = await supabaseAdmin
      .from("chat_image_uploads")
      .select("file_size_bytes")
      .lt("uploaded_at", twoDaysAgo);

    if (statsError) throw statsError;

    if (stats) {
      freedBytes = stats.reduce((sum, s) => sum + (s.file_size_bytes || 0), 0);
    }

    // Delete records from tracking table
    const { error: cleanError } = await supabaseAdmin
      .from("chat_image_uploads")
      .delete()
      .lt("uploaded_at", twoDaysAgo);

    if (cleanError) throw cleanError;

    return NextResponse.json({
      ok: true,
      deletedImages: deletedCount,
      freedBytes: freedBytes,
      freedMB: Math.round(freedBytes / 1024 / 1024),
      message: `Deleted ${deletedCount} images, freed ${Math.round(freedBytes / 1024 / 1024)}MB`,
    });
  } catch (error) {
    console.error("Image cleanup failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cleanup failed" },
      { status: 500 }
    );
  }
}
