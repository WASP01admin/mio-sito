import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check your .env.local against .env.example."
  );
}

// Shared client for both the public site and the private organization
// login area. No schema or auth logic is wired up yet.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
