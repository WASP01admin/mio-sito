import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing Supabase service role environment variables. Check web/.env.local against .env.example."
  );
}

// Server-only client: bypasses Row Level Security. Only import this from
// Route Handlers or other server-side code, never from client components.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
