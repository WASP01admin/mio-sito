import { supabase } from "./supabase";

// Delete messages older than 24 hours (soft-delete via deleted_at)
export async function cleanupOldMessages(): Promise<void> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("chat_messages")
      .update({ deleted_at: new Date().toISOString() })
      .lt("created_at", twentyFourHoursAgo)
      .is("deleted_at", null);

    if (error) {
      console.error("Message cleanup failed:", error);
    } else {
      console.log("Chat message cleanup completed");
    }
  } catch (error) {
    console.error("Message cleanup error:", error);
  }
}

// Schedule cleanup to run every hour (and once on startup)
export function scheduleCleanup(): void {
  // Run immediately on startup
  cleanupOldMessages();

  // Then run every hour
  setInterval(() => {
    cleanupOldMessages();
  }, 60 * 60 * 1000);

  console.log("Message cleanup scheduled (hourly)");
}
